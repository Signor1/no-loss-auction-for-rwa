// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title RWAAssetNFT
/// @notice ERC-721 compatible NFT for representing unique Real World Assets (RWAs)
///         such as real estate, art, and collectibles, with:
///           - Metadata URI storage
///           - Enumerable extension
///           - ERC-2981 royalty standard
///           - Compliance-aware transfer restrictions
///           - Multi-token (multi-asset) support per contract
contract RWAAssetNFT {

    // =============================================================
    //                           EVENTS
    // =============================================================

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    event Paused(address indexed account);
    event Unpaused(address indexed account);

    event TransferRestrictionsUpdated(bool enabled);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event ComplianceAdminUpdated(address indexed previousAdmin, address indexed newAdmin);

    event DefaultRoyaltySet(address indexed receiver, uint96 feeNumerator);
    event TokenRoyaltySet(uint256 indexed tokenId, address indexed receiver, uint96 feeNumerator);
    event DefaultRoyaltyDeleted();
    event TokenRoyaltyReset(uint256 indexed tokenId);

    // =============================================================
    //                          CONSTANTS
    // =============================================================

    // bytes4(keccak256("supportsInterface(bytes4)"))
    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

    // ERC-721 interface id: 0x80ac58cd
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

    // ERC-721 Metadata interface id: 0x5b5e139f
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;

    // ERC-2981 interface id: 0x2a55205a
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    uint96 private constant _FEE_DENOMINATOR = 10_000;

    // =============================================================
    //                          ERC-721 CORE
    // =============================================================

    string private _name;
    string private _symbol;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // =============================================================
    //                        METADATA STORAGE
    // =============================================================

    // Optional base URI for all tokens (can be empty).
    string private _baseTokenURI;

    // Optional per-token URI override.
    mapping(uint256 => string) private _tokenURIs;

    // =============================================================
    //                           ENUMERABLE
    // =============================================================

    // Array of all token IDs for global enumeration
    uint256[] private _allTokens;
    // Mapping from token ID to its index in _allTokens
    mapping(uint256 => uint256) private _allTokensIndex;

    // Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;
    // Mapping from token ID to index in the owner's ownedTokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // =============================================================
    //                          ROYALTIES (2981)
    // =============================================================

    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction; // in basis points (parts per 10,000)
    }

    RoyaltyInfo private _defaultRoyaltyInfo;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;

    // =============================================================
    //                       OWNERSHIP & ROLES
    // =============================================================

    address public owner;
    address public complianceAdmin;

    modifier onlyOwner() {
        require(msg.sender == owner, "RWA721: caller is not owner");
        _;
    }

    modifier onlyOwnerOrCompliance() {
        require(msg.sender == owner || msg.sender == complianceAdmin, "RWA721: not authorized");
        _;
    }

    // =============================================================
    //                       PAUSABLE & COMPLIANCE
    // =============================================================

    bool private _paused;

    /// @dev When true, NFT transfers are restricted to whitelisted parties.
    bool public transferRestrictionsEnabled;

    /// @dev Whitelist of addresses that are allowed to send/receive when restrictions are enabled.
    mapping(address => bool) private _whitelist;

    modifier whenNotPaused() {
        require(!_paused, "RWA721: paused");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @param name_ Collection name
    /// @param symbol_ Collection symbol
    /// @param initialOwner Contract owner (platform / issuer)
    /// @param enableRestrictions Whether to enable transfer restrictions by default
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        bool enableRestrictions
    ) {
        require(initialOwner != address(0), "RWA721: owner is zero");

        _name = name_;
        _symbol = symbol_;

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
            interfaceId == _INTERFACE_ID_ERC721 ||
            interfaceId == _INTERFACE_ID_ERC721_METADATA ||
            interfaceId == _INTERFACE_ID_ERC2981;
    }

    // =============================================================
    //                      ERC-721 BASIC VIEW
    // =============================================================

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function balanceOf(address owner_) public view returns (uint256) {
        require(owner_ != address(0), "RWA721: balance query for zero");
        return _balances[owner_];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "RWA721: owner query for nonexistent");
        return tokenOwner;
    }

    // =============================================================
    //                        METADATA (URI)
    // =============================================================

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "RWA721: URI query for nonexistent");

        string memory tokenSpecificURI = _tokenURIs[tokenId];
        if (bytes(tokenSpecificURI).length > 0) {
            return tokenSpecificURI;
        }

        return _baseTokenURI;
    }

    /// @notice Set a global base URI for all tokens (used when no per-token URI is set).
    function setBaseTokenURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /// @notice Set a specific URI for a given tokenId.
    function setTokenURI(uint256 tokenId, string calldata uri_) external onlyOwnerOrCompliance {
        require(_exists(tokenId), "RWA721: set URI for nonexistent");
        _tokenURIs[tokenId] = uri_;
    }

    // =============================================================
    //                         ENUMERABLE VIEW
    // =============================================================

    function totalSupply() external view returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) external view returns (uint256) {
        require(index < _allTokens.length, "RWA721: global index out of bounds");
        return _allTokens[index];
    }

    function tokenOfOwnerByIndex(address owner_, uint256 index) external view returns (uint256) {
        require(index < _ownedTokens[owner_].length, "RWA721: owner index out of bounds");
        return _ownedTokens[owner_][index];
    }

    // =============================================================
    //                          ROYALTIES (2981)
    // =============================================================

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        RoyaltyInfo memory royalty = _tokenRoyaltyInfo[tokenId];

        if (royalty.receiver == address(0)) {
            royalty = _defaultRoyaltyInfo;
        }

        if (royalty.receiver == address(0)) {
            return (address(0), 0);
        }

        royaltyAmount = (salePrice * royalty.royaltyFraction) / _FEE_DENOMINATOR;
        return (royalty.receiver, royaltyAmount);
    }

    /// @notice Set a default royalty for all tokens.
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        require(receiver != address(0), "RWA721: invalid receiver");
        require(feeNumerator <= _FEE_DENOMINATOR, "RWA721: fee exceeds denominator");

        _defaultRoyaltyInfo = RoyaltyInfo(receiver, feeNumerator);
        emit DefaultRoyaltySet(receiver, feeNumerator);
    }

    /// @notice Delete the default royalty.
    function deleteDefaultRoyalty() external onlyOwner {
        delete _defaultRoyaltyInfo;
        emit DefaultRoyaltyDeleted();
    }

    /// @notice Set royalty information for a specific tokenId.
    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator)
        external
        onlyOwnerOrCompliance
    {
        require(_exists(tokenId), "RWA721: royalty set for nonexistent");
        require(receiver != address(0), "RWA721: invalid receiver");
        require(feeNumerator <= _FEE_DENOMINATOR, "RWA721: fee exceeds denominator");

        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, feeNumerator);
        emit TokenRoyaltySet(tokenId, receiver, feeNumerator);
    }

    /// @notice Reset token-specific royalty to use the default.
    function resetTokenRoyalty(uint256 tokenId) external onlyOwnerOrCompliance {
        require(_exists(tokenId), "RWA721: royalty reset for nonexistent");
        delete _tokenRoyaltyInfo[tokenId];
        emit TokenRoyaltyReset(tokenId);
    }

    // =============================================================
    //                      APPROVALS & OPERATORS
    // =============================================================

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "RWA721: approved query for nonexistent");
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner_, address operator) public view returns (bool) {
        return _operatorApprovals[owner_][operator];
    }

    function approve(address to, uint256 tokenId) external whenNotPaused {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "RWA721: approval to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "RWA721: caller not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external whenNotPaused {
        require(operator != msg.sender, "RWA721: approve to caller");

        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // =============================================================
    //                          TRANSFERS
    // =============================================================

    function transferFrom(address from, address to, uint256 tokenId) public whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "RWA721: caller not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external whenNotPaused {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        whenNotPaused
    {
        require(_isApprovedOrOwner(msg.sender, tokenId), "RWA721: caller not owner nor approved");
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "RWA721: transfer to non ERC721Receiver");
    }

    // =============================================================
    //                        MINT & BURN
    // =============================================================

    /// @notice Mint a new NFT representing a unique RWA.
    /// @dev Only owner or compliance admin can mint.
    function mint(address to, uint256 tokenId) external onlyOwnerOrCompliance whenNotPaused {
        _mint(to, tokenId);
    }

    /// @notice Burn an existing NFT (e.g., asset retired or migrated).
    /// @dev Only owner or compliance admin can burn to keep lifecycle under control.
    function burn(uint256 tokenId) external onlyOwnerOrCompliance whenNotPaused {
        address tokenOwner = ownerOf(tokenId);
        _burn(tokenOwner, tokenId);
    }

    // =============================================================
    //                    PAUSABLE CONTROL / COMPLIANCE
    // =============================================================

    function paused() external view returns (bool) {
        return _paused;
    }

    function pause() external onlyOwnerOrCompliance {
        require(!_paused, "RWA721: already paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwnerOrCompliance {
        require(_paused, "RWA721: not paused");
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
        require(newAdmin != address(0), "RWA721: admin is zero");
        address previous = complianceAdmin;
        complianceAdmin = newAdmin;
        emit ComplianceAdminUpdated(previous, newAdmin);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RWA721: new owner is zero");
        owner = newOwner;
    }

    // =============================================================
    //                        INTERNAL HELPERS
    // =============================================================

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (
            spender == tokenOwner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(tokenOwner, spender)
        );
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "RWA721: transfer from incorrect owner");
        require(to != address(0), "RWA721: transfer to zero");

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals
        _approve(address(0), tokenId);

        // Update balances and ownership
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "RWA721: mint to zero");
        require(!_exists(tokenId), "RWA721: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId);

        _balances[to] += 1;
        _owners[tokenId] = to;

        _addTokenToAllTokensEnumeration(tokenId);
        _addTokenToOwnerEnumeration(to, tokenId);

        emit Transfer(address(0), to, tokenId);
    }

    function _burn(address from, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "RWA721: burn from incorrect owner");

        _beforeTokenTransfer(from, address(0), tokenId);

        // Clear approvals
        _approve(address(0), tokenId);

        _balances[from] -= 1;
        delete _owners[tokenId];

        _removeTokenFromOwnerEnumeration(from, tokenId);
        _removeTokenFromAllTokensEnumeration(tokenId);

        // Clear token URI and royalty info
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
        if (_tokenRoyaltyInfo[tokenId].receiver != address(0)) {
            delete _tokenRoyaltyInfo[tokenId];
        }

        emit Transfer(from, address(0), tokenId);
    }

    // =============================================================
    //                       ENUMERATION HELPERS
    // =============================================================

    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        uint256 lastIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        if (tokenIndex != lastIndex) {
            uint256 lastTokenId = _allTokens[lastIndex];
            _allTokens[tokenIndex] = lastTokenId;
            _allTokensIndex[lastTokenId] = tokenIndex;
        }

        _allTokens.pop();
        delete _allTokensIndex[tokenId];
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];
    }

    // =============================================================
    //                   TRANSFER HOOK & RESTRICTIONS
    // =============================================================

    function _beforeTokenTransfer(address from, address to, uint256 /*tokenId*/ ) internal view {
        if (transferRestrictionsEnabled) {
            bool isMint = from == address(0);
            bool isBurn = to == address(0);

            if (!isMint && !isBurn) {
                require(_whitelist[from], "RWA721: sender not whitelisted");
                require(_whitelist[to], "RWA721: recipient not whitelisted");
            }
        }
    }

    // =============================================================
    //                   SAFE TRANSFER RECEIVER CHECK
    // =============================================================

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length == 0) {
            return true;
        }

        // Call onERC721Received via a low-level static interface to avoid separate declarations
        (bool success, bytes memory returndata) =
            to.call(abi.encodeWithSignature("onERC721Received(address,address,uint256,bytes)", msg.sender, from, tokenId, data));

        if (!success || returndata.length < 32) {
            return false;
        }

        bytes4 retval = abi.decode(returndata, (bytes4));
        return retval == bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }
}


