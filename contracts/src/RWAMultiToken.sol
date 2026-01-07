// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title RWAMultiToken
/// @notice ERC-1155 compatible multi-token contract for flexible RWA representation,
///         supporting both fungible and non-fungible tokens in a single contract.
///         Features:
///           - Batch operations for efficient gas usage
///           - Metadata URI per token ID
///           - Supply tracking per token ID
///           - Compliance-aware transfer restrictions
///           - Pausable functionality
/// @dev This contract implements the full ERC-1155 standard with additional
///      RWA-specific compliance features for the No Loss Auction platform.
contract RWAMultiToken {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    event Paused(address indexed account);
    event Unpaused(address indexed account);

    event TransferRestrictionsUpdated(bool enabled);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event ComplianceAdminUpdated(address indexed previousAdmin, address indexed newAdmin);

    // =============================================================
    //                          CONSTANTS
    // =============================================================

    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC1155 = 0xd9b67a26;
    bytes4 private constant _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;

    bytes4 private constant _ERC1155_RECEIVED = 0xf23a6e61;
    bytes4 private constant _ERC1155_BATCH_RECEIVED = 0xbc197c81;

    // =============================================================
    //                          ERC-1155 CORE
    // =============================================================

    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) private _balances;

    // Mapping from account to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // =============================================================
    //                        METADATA STORAGE
    // =============================================================

    // Optional base URI for all tokens (can be empty).
    string private _baseURI;

    // Per-token URI override (tokenId => URI)
    mapping(uint256 => string) private _tokenURIs;

    // =============================================================
    //                        SUPPLY TRACKING
    // =============================================================

    // Total supply per token ID (for fungible tokens, this tracks total minted)
    // For non-fungible tokens (supply = 1), this also tracks existence
    mapping(uint256 => uint256) private _totalSupply;

    // =============================================================
    //                       OWNERSHIP & ROLES
    // =============================================================

    address public owner;
    address public complianceAdmin;

    modifier onlyOwner() {
        require(msg.sender == owner, "RWA1155: caller is not owner");
        _;
    }

    modifier onlyOwnerOrCompliance() {
        require(msg.sender == owner || msg.sender == complianceAdmin, "RWA1155: not authorized");
        _;
    }

    // =============================================================
    //                       PAUSABLE & COMPLIANCE
    // =============================================================

    bool private _paused;

    /// @dev When true, token transfers are restricted to whitelisted parties.
    bool public transferRestrictionsEnabled;

    /// @dev Whitelist of addresses that are allowed to send/receive when restrictions are enabled.
    mapping(address => bool) private _whitelist;

    modifier whenNotPaused() {
        require(!_paused, "RWA1155: paused");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @param initialOwner Contract owner (platform / issuer)
    /// @param enableRestrictions Whether to enable transfer restrictions by default
    constructor(address initialOwner, bool enableRestrictions) {
        require(initialOwner != address(0), "RWA1155: owner is zero");

        owner = initialOwner;
        complianceAdmin = initialOwner;
        transferRestrictionsEnabled = enableRestrictions;
    }

    // =============================================================
    //                      ERC-165 / INTERFACES
    // =============================================================

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == _INTERFACE_ID_ERC165 ||
            interfaceId == _INTERFACE_ID_ERC1155 ||
            interfaceId == _INTERFACE_ID_ERC1155_METADATA_URI;
    }

    // =============================================================
    //                      ERC-1155 BASIC VIEW
    // =============================================================

    /// @notice Get the balance of an account for a specific token ID.
    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "RWA1155: balance query for zero");
        return _balances[id][account];
    }

    /// @notice Get balances for multiple accounts and token IDs in a single call.
    /// @dev Efficient batch query to reduce gas costs.
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "RWA1155: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    /// @notice Check if an operator is approved for all tokens of an account.
    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    // =============================================================
    //                        METADATA (URI)
    // =============================================================

    /// @notice Get the URI for a specific token ID.
    /// @dev Returns per-token URI if set, otherwise returns base URI.
    function uri(uint256 id) external view returns (string memory) {
        string memory tokenSpecificURI = _tokenURIs[id];
        if (bytes(tokenSpecificURI).length > 0) {
            return tokenSpecificURI;
        }

        // If base URI is set, append token ID (common pattern: baseURI + tokenId)
        if (bytes(_baseURI).length > 0) {
            return string(abi.encodePacked(_baseURI, _toString(id)));
        }

        return "";
    }

    /// @notice Set a global base URI for all tokens.
    /// @dev Used when tokens follow a pattern like "ipfs://.../{id}.json"
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseURI = baseURI;
    }

    /// @notice Set a specific URI for a given token ID.
    /// @dev Overrides base URI for this specific token.
    function setTokenURI(uint256 id, string calldata tokenURI_) external onlyOwnerOrCompliance {
        _tokenURIs[id] = tokenURI_;
        emit URI(tokenURI_, id);
    }

    // =============================================================
    //                        SUPPLY TRACKING
    // =============================================================

    /// @notice Get the total supply (total minted) for a specific token ID.
    /// @dev For fungible tokens, this is the total minted amount.
    ///      For non-fungible tokens (supply = 1), this indicates existence.
    function totalSupply(uint256 id) external view returns (uint256) {
        return _totalSupply[id];
    }

    /// @notice Check if a token ID exists (has been minted at least once).
    function exists(uint256 id) external view returns (bool) {
        return _totalSupply[id] > 0;
    }

    // =============================================================
    //                      APPROVALS & OPERATORS
    // =============================================================

    /// @notice Approve or revoke an operator's ability to transfer all tokens on behalf of the caller.
    function setApprovalForAll(address operator, bool approved) external whenNotPaused {
        require(operator != msg.sender, "RWA1155: approve to caller");

        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // =============================================================
    //                          TRANSFERS
    // =============================================================

    /// @notice Transfer a single token ID from one address to another.
    /// @dev Safe transfer that checks if recipient can handle ERC-1155 tokens.
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external whenNotPaused {
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "RWA1155: caller is not owner nor approved"
        );

        _safeTransferFrom(from, to, id, amount, data);
    }

    /// @notice Transfer multiple token IDs from one address to another in a single transaction.
    /// @dev Batch operation for efficient gas usage when transferring multiple tokens.
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external whenNotPaused {
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "RWA1155: caller is not owner nor approved"
        );
        require(ids.length == amounts.length, "RWA1155: ids and amounts length mismatch");

        for (uint256 i = 0; i < ids.length; ++i) {
            _safeTransferFrom(from, to, ids[i], amounts[i], data);
        }
    }

    // =============================================================
    //                        MINT & BURN
    // =============================================================

    /// @notice Mint tokens of a specific ID to an address.
    /// @dev Can mint fungible tokens (amount > 1) or non-fungible tokens (amount = 1).
    ///      Only owner or compliance admin can mint.
    function mint(address to, uint256 id, uint256 amount, bytes calldata data)
        external
        onlyOwnerOrCompliance
        whenNotPaused
    {
        _mint(to, id, amount, data);
    }

    /// @notice Mint multiple token IDs in a single transaction (batch mint).
    /// @dev Efficient batch operation for minting multiple tokens at once.
    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external onlyOwnerOrCompliance whenNotPaused {
        require(ids.length == amounts.length, "RWA1155: ids and amounts length mismatch");

        for (uint256 i = 0; i < ids.length; ++i) {
            _mint(to, ids[i], amounts[i], data);
        }
    }

    /// @notice Burn tokens of a specific ID from an address.
    /// @dev Only owner or compliance admin can burn to maintain lifecycle control.
    function burn(address from, uint256 id, uint256 amount) external onlyOwnerOrCompliance whenNotPaused {
        _burn(from, id, amount);
    }

    /// @notice Burn multiple token IDs in a single transaction (batch burn).
    /// @dev Efficient batch operation for burning multiple tokens at once.
    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts)
        external
        onlyOwnerOrCompliance
        whenNotPaused
    {
        require(ids.length == amounts.length, "RWA1155: ids and amounts length mismatch");

        for (uint256 i = 0; i < ids.length; ++i) {
            _burn(from, ids[i], amounts[i]);
        }
    }

    // =============================================================
    //                    PAUSABLE CONTROL / COMPLIANCE
    // =============================================================

    function paused() external view returns (bool) {
        return _paused;
    }

    function pause() external onlyOwnerOrCompliance {
        require(!_paused, "RWA1155: already paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwnerOrCompliance {
        require(_paused, "RWA1155: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }

    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }

    function setTransferRestrictionsEnabled(bool enabled) external onlyOwnerOrCompliance {
        transferRestrictionsEnabled = enabled;
        emit TransferRestrictionsUpdated(enabled);
    }

    function setWhitelist(address account, bool allowed) external onlyOwnerOrCompliance {
        _whitelist[account] = allowed;
        emit WhitelistUpdated(account, allowed);
    }

    function setComplianceAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "RWA1155: admin is zero");
        address previous = complianceAdmin;
        complianceAdmin = newAdmin;
        emit ComplianceAdminUpdated(previous, newAdmin);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RWA1155: new owner is zero");
        owner = newOwner;
    }

    // =============================================================
    //                        INTERNAL HELPERS
    // =============================================================

    function _safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)
        internal
    {
        require(to != address(0), "RWA1155: transfer to zero");

        _beforeTokenTransfer(from, to, id, amount);

        address operator = msg.sender;

        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "RWA1155: insufficient balance for transfer");

        unchecked {
            _balances[id][from] = fromBalance - amount;
        }
        _balances[id][to] += amount;

        emit TransferSingle(operator, from, to, id, amount);

        _doSafeTransferAcceptanceCheck(operator, from, to, id, amount, data);
    }

    function _mint(address to, uint256 id, uint256 amount, bytes calldata data) internal {
        require(to != address(0), "RWA1155: mint to zero");
        require(amount > 0, "RWA1155: amount is zero");

        _beforeTokenTransfer(address(0), to, id, amount);

        address operator = msg.sender;

        _balances[id][to] += amount;
        _totalSupply[id] += amount;

        emit TransferSingle(operator, address(0), to, id, amount);

        _doSafeTransferAcceptanceCheck(operator, address(0), to, id, amount, data);
    }

    function _burn(address from, uint256 id, uint256 amount) internal {
        require(from != address(0), "RWA1155: burn from zero");
        require(amount > 0, "RWA1155: amount is zero");

        _beforeTokenTransfer(from, address(0), id, amount);

        address operator = msg.sender;

        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "RWA1155: burn amount exceeds balance");

        unchecked {
            _balances[id][from] = fromBalance - amount;
        }
        unchecked {
            _totalSupply[id] -= amount;
        }

        emit TransferSingle(operator, from, address(0), id, amount);
    }

    // =============================================================
    //                   TRANSFER HOOK & RESTRICTIONS
    // =============================================================

    function _beforeTokenTransfer(address from, address to, uint256 /*id*/, uint256 /*amount*/) internal view {
        if (transferRestrictionsEnabled) {
            bool isMint = from == address(0);
            bool isBurn = to == address(0);

            if (!isMint && !isBurn) {
                require(_whitelist[from], "RWA1155: sender not whitelisted");
                require(_whitelist[to], "RWA1155: recipient not whitelisted");
            }
        }
    }

    // =============================================================
    //                   SAFE TRANSFER RECEIVER CHECK
    // =============================================================

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) private {
        if (to.code.length > 0) {
            // Call onERC1155Received via low-level call to avoid interface dependency
            (bool success, bytes memory returndata) = to.call(
                abi.encodeWithSignature(
                    "onERC1155Received(address,address,uint256,uint256,bytes)",
                    operator,
                    from,
                    id,
                    amount,
                    data
                )
            );

            if (!success) {
                if (returndata.length == 0) {
                    revert("RWA1155: transfer to non ERC1155Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, returndata), mload(returndata))
                    }
                }
            }

            bytes4 retval = abi.decode(returndata, (bytes4));
            bytes4 expected = bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
            if (retval != expected) {
                revert("RWA1155: ERC1155Receiver rejected tokens");
            }
        }
    }

    // =============================================================
    //                        UTILITY FUNCTIONS
    // =============================================================

    /// @dev Convert uint256 to string (for URI construction).
    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

