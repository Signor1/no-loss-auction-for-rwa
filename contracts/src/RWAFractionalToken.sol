// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title RWAFractionalToken
/// @notice ERC-20 compatible token for fractional ownership of RWAs with
///         compliance-aware transfer restrictions, pausability, burnability,
///         metadata, and snapshot functionality for governance and reporting.
///
/// @dev This contract is intentionally self-contained (no external dependencies)
///      so it can be used as a base building block for the broader No Loss
///      Auction system. It follows the ERC-20 and ERC-20Metadata interfaces,
///      with additional compliance and snapshot features inspired by
///      OpenZeppelin's extensions.
contract RWAFractionalToken {
    // =============================================================
    //                           EVENTS
    // =============================================================

    /// @dev Standard ERC-20 events.
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @dev Emitted when the contract is paused or unpaused.
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    /// @dev Emitted when transfer restrictions are enabled/disabled.
    event TransferRestrictionsUpdated(bool enabled);

    /// @dev Emitted when an address's whitelist status changes.
    event WhitelistUpdated(address indexed account, bool isWhitelisted);

    /// @dev Emitted when the compliance admin is updated.
    event ComplianceAdminUpdated(address indexed previousAdmin, address indexed newAdmin);

    /// @dev Emitted when a new snapshot is created.
    event SnapshotCreated(uint256 id);

    // =============================================================
    //                           ERC-20
    // =============================================================

    string private _name;
    string private _symbol;
    uint8 private immutable _decimals;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // =============================================================
    //                       OWNERSHIP & ROLES
    // =============================================================

    address public owner;
    address public complianceAdmin;

    modifier onlyOwner() {
        require(msg.sender == owner, "RWA: caller is not owner");
        _;
    }

    modifier onlyOwnerOrCompliance() {
        require(msg.sender == owner || msg.sender == complianceAdmin, "RWA: not authorized");
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
        require(!_paused, "RWA: paused");
        _;
    }

    // =============================================================
    //                           SNAPSHOTS
    // =============================================================

    struct Snapshots {
        uint256[] ids;
        uint256[] values;
    }

    mapping(address => Snapshots) private _accountBalanceSnapshots;
    Snapshots private _totalSupplySnapshots;

    uint256 private _currentSnapshotId;

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @param name_ Token name (ERC-20Metadata)
    /// @param symbol_ Token symbol (ERC-20Metadata)
    /// @param decimals_ Number of decimals used for user representation
    /// @param initialOwner Address that will own the contract and receive the initial supply
    /// @param initialSupply Initial token supply (in smallest units) minted to the owner
    /// @param enableRestrictions Whether to enable transfer restrictions by default
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address initialOwner,
        uint256 initialSupply,
        bool enableRestrictions
    ) {
        require(initialOwner != address(0), "RWA: owner is zero");

        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        owner = initialOwner;
        complianceAdmin = initialOwner;

        transferRestrictionsEnabled = enableRestrictions;

        _mint(initialOwner, initialSupply);
    }

    // =============================================================
    //                      ERC-20 BASIC VIEW
    // =============================================================

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner_, address spender) external view returns (uint256) {
        return _allowances[owner_][spender];
    }

    // =============================================================
    //                          ERC-20 CORE
    // =============================================================

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external whenNotPaused returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "RWA: insufficient allowance");

        unchecked {
            _approve(from, msg.sender, currentAllowance - amount);
        }

        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "RWA: transfer from zero");
        require(to != address(0), "RWA: transfer to zero");
        require(amount > 0, "RWA: amount is zero");

        _beforeTokenTransfer(from, to, amount);

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "RWA: transfer exceeds balance");

        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    function _approve(address owner_, address spender, uint256 amount) internal {
        require(owner_ != address(0), "RWA: approve from zero");
        require(spender != address(0), "RWA: approve to zero");

        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    // =============================================================
    //                        MINT & BURN
    // =============================================================

    /// @notice Mint new tokens to a recipient.
    /// @dev Only the owner or compliance admin can mint new supply.
    function mint(address to, uint256 amount) external onlyOwnerOrCompliance whenNotPaused {
        _mint(to, amount);
    }

    /// @notice Burn tokens from the caller's balance.
    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
    }

    /// @notice Burn tokens from another account using allowance.
    function burnFrom(address account, uint256 amount) external whenNotPaused {
        uint256 currentAllowance = _allowances[account][msg.sender];
        require(currentAllowance >= amount, "RWA: burn exceeds allowance");

        unchecked {
            _approve(account, msg.sender, currentAllowance - amount);
        }

        _burn(account, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "RWA: mint to zero");
        require(amount > 0, "RWA: amount is zero");

        _beforeTokenTransfer(address(0), to, amount);

        _totalSupply += amount;
        _balances[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "RWA: burn from zero");
        require(amount > 0, "RWA: amount is zero");

        _beforeTokenTransfer(from, address(0), amount);

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "RWA: burn exceeds balance");

        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(from, address(0), amount);
    }

    // =============================================================
    //                    PAUSABLE CONTROL (1.1)
    // =============================================================

    /// @notice Returns true if the contract is paused.
    function paused() external view returns (bool) {
        return _paused;
    }

    /// @notice Pause all token transfers, minting, and burning.
    /// @dev Designed for emergency stop mechanisms and compliance actions.
    function pause() external onlyOwnerOrCompliance {
        require(!_paused, "RWA: already paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause the contract and resume token operations.
    function unpause() external onlyOwnerOrCompliance {
        require(_paused, "RWA: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // =============================================================
    //               COMPLIANCE / TRANSFER RESTRICTIONS (1.1)
    // =============================================================

    /// @notice Returns whether an address is whitelisted for transfers when
    ///         restrictions are enabled.
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }

    /// @notice Enable or disable global transfer restrictions.
    /// @dev When enabled, both sender and recipient must be whitelisted
    ///      for non-mint/non-burn transfers.
    function setTransferRestrictionsEnabled(bool enabled) external onlyOwnerOrCompliance {
        transferRestrictionsEnabled = enabled;
        emit TransferRestrictionsUpdated(enabled);
    }

    /// @notice Set the whitelist status of an account.
    /// @dev Owner or compliance admin can manage the whitelist.
    function setWhitelist(address account, bool allowed) external onlyOwnerOrCompliance {
        _whitelist[account] = allowed;
        emit WhitelistUpdated(account, allowed);
    }

    /// @notice Update the compliance admin address.
    function setComplianceAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "RWA: admin is zero");
        address previous = complianceAdmin;
        complianceAdmin = newAdmin;
        emit ComplianceAdminUpdated(previous, newAdmin);
    }

    /// @notice Transfer contract ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RWA: new owner is zero");
        owner = newOwner;
    }

    // =============================================================
    //                         SNAPSHOTS (1.1)
    // =============================================================

    /// @notice Returns the current snapshot ID.
    function currentSnapshotId() external view returns (uint256) {
        return _currentSnapshotId;
    }

    /// @notice Create a new snapshot for balances and total supply.
    /// @dev Intended for governance votes, dividend distribution, and audits.
    function snapshot() external onlyOwnerOrCompliance returns (uint256) {
        _currentSnapshotId += 1;

        _updateTotalSupplySnapshot();

        emit SnapshotCreated(_currentSnapshotId);
        return _currentSnapshotId;
    }

    /// @notice Get the balance of an account at a specific snapshot.
    function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(snapshotId, _accountBalanceSnapshots[account]);
        return snapshotted ? value : _balances[account];
    }

    /// @notice Get the total supply at a specific snapshot.
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(snapshotId, _totalSupplySnapshots);
        return snapshotted ? value : _totalSupply;
    }

    // =============================================================
    //                      INTERNAL SNAPSHOT LOGIC
    // =============================================================

    function _valueAt(uint256 snapshotId, Snapshots storage snapshots) private view returns (bool, uint256) {
        require(snapshotId > 0, "RWA: snapshot id is 0");
        require(snapshotId <= _currentSnapshotId, "RWA: nonexistent id");

        uint256 length = snapshots.ids.length;
        if (length == 0) {
            return (false, 0);
        }

        // Binary search in the snapshot ids array to find an exact match
        uint256 low = 0;
        uint256 high = length;
        while (low < high) {
            uint256 mid = (low + high) / 2;
            uint256 midId = snapshots.ids[mid];
            if (midId == snapshotId) {
                return (true, snapshots.values[mid]);
            } else if (midId < snapshotId) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        // No exact snapshot for this id; fall back to live value
        return (false, 0);
    }

    function _updateAccountSnapshot(address account) private {
        _updateSnapshot(_accountBalanceSnapshots[account], _balances[account]);
    }

    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(_totalSupplySnapshots, _totalSupply);
    }

    function _updateSnapshot(Snapshots storage snapshots, uint256 currentValue) private {
        uint256 currentId = _currentSnapshotId;
        if (_lastSnapshotId(snapshots.ids) < currentId) {
            snapshots.ids.push(currentId);
            snapshots.values.push(currentValue);
        }
    }

    function _lastSnapshotId(uint256[] storage ids) private view returns (uint256) {
        uint256 length = ids.length;
        return length == 0 ? 0 : ids[length - 1];
    }

    // =============================================================
    //                     TRANSFER HOOK & ENFORCEMENT
    // =============================================================

    /// @dev Hook that is called before any transfer of tokens, including mint and burn.
    ///      It enforces:
    ///        - Paused state (via modifiers on external functions)
    ///        - Transfer restrictions (whitelist when enabled)
    ///        - Snapshot bookkeeping
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        // Enforce transfer restrictions only for "normal" transfers
        if (transferRestrictionsEnabled) {
            bool isMint = from == address(0);
            bool isBurn = to == address(0);

            if (!isMint && !isBurn) {
                require(_whitelist[from], "RWA: sender not whitelisted");
                require(_whitelist[to], "RWA: recipient not whitelisted");
            }
        }

        if (_currentSnapshotId > 0) {
            if (from != address(0)) {
                _updateAccountSnapshot(from);
            }
            if (to != address(0)) {
                _updateAccountSnapshot(to);
            }
            _updateTotalSupplySnapshot();
        }

        // Silence compiler warnings about unused variables
        amount;
    }
}


