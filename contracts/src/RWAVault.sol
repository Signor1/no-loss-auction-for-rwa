// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title RWAVault
/// @notice ERC-4626 compliant tokenized vault for managing RWA asset pools.
///         Features:
///           - Share calculation (convertToShares/convertToAssets)
///           - Deposit/withdrawal mechanisms (deposit, mint, withdraw, redeem)
///           - Asset accounting (totalAssets tracking)
///           - Fee management (management fees, performance fees)
/// @dev This vault allows users to deposit underlying assets and receive
///      vault shares representing their proportional ownership of the pool.
contract RWAVault {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    event ManagementFeeUpdated(uint256 oldFee, uint256 newFee);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesCollected(uint256 managementFee, uint256 performanceFee);
    event FeeRecipientUpdated(address indexed previousRecipient, address indexed newRecipient);

    // =============================================================
    //                          CONSTANTS
    // =============================================================

    uint256 private constant MAX_FEE = 10_000; // 100% in basis points
    uint256 private constant FEE_DENOMINATOR = 10_000; // Basis points denominator

    // =============================================================
    //                          ERC-20 CORE
    // =============================================================

    string private _name;
    string private _symbol;
    uint8 private immutable _decimals;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // =============================================================
    //                       VAULT ASSETS
    // =============================================================

    /// @dev The underlying asset token (e.g., USDC, DAI, or custom RWA token)
    address public immutable asset;

    /// @dev Total assets managed by the vault (including accrued fees)
    uint256 private _totalAssets;

    /// @dev High water mark for performance fee calculation
    uint256 private _highWaterMark;

    // =============================================================
    //                        FEE MANAGEMENT
    // =============================================================

    /// @dev Management fee in basis points (e.g., 200 = 2%)
    uint256 public managementFeeBps;

    /// @dev Performance fee in basis points (e.g., 2000 = 20%)
    uint256 public performanceFeeBps;

    /// @dev Address that receives collected fees
    address public feeRecipient;

    /// @dev Last time fees were collected
    uint256 public lastFeeCollection;

    /// @dev Fee collection period in seconds (e.g., 30 days)
    uint256 public feeCollectionPeriod;

    // =============================================================
    //                       ACCESS CONTROL
    // =============================================================

    address public owner;
    address public manager; // Vault manager who can collect fees

    modifier onlyOwner() {
        require(msg.sender == owner, "RWAVault: caller is not owner");
        _;
    }

    modifier onlyOwnerOrManager() {
        require(msg.sender == owner || msg.sender == manager, "RWAVault: not authorized");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @param asset_ Address of the underlying asset token (must be ERC-20)
    /// @param name_ Vault token name
    /// @param symbol_ Vault token symbol
    /// @param owner_ Vault owner
    /// @param manager_ Vault manager (can collect fees)
    /// @param feeRecipient_ Address that receives fees
    /// @param managementFeeBps_ Management fee in basis points
    /// @param performanceFeeBps_ Performance fee in basis points
    constructor(
        address asset_,
        string memory name_,
        string memory symbol_,
        address owner_,
        address manager_,
        address feeRecipient_,
        uint256 managementFeeBps_,
        uint256 performanceFeeBps_
    ) {
        require(asset_ != address(0), "RWAVault: asset is zero");
        require(owner_ != address(0), "RWAVault: owner is zero");
        require(feeRecipient_ != address(0), "RWAVault: fee recipient is zero");
        require(managementFeeBps_ <= MAX_FEE, "RWAVault: management fee too high");
        require(performanceFeeBps_ <= MAX_FEE, "RWAVault: performance fee too high");

        asset = asset_;
        _name = name_;
        _symbol = symbol_;
        _decimals = 18; // Vault shares always use 18 decimals

        owner = owner_;
        manager = manager_;
        feeRecipient = feeRecipient_;

        managementFeeBps = managementFeeBps_;
        performanceFeeBps = performanceFeeBps_;

        feeCollectionPeriod = 30 days;
        lastFeeCollection = block.timestamp;
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
    //                      ERC-4626 VIEW FUNCTIONS
    // =============================================================

    /// @notice Returns the total amount of underlying assets managed by the vault.
    /// @dev Includes accrued fees that haven't been collected yet.
    function totalAssets() public view returns (uint256) {
        return _totalAssets;
    }

    /// @notice Convert assets to shares.
    /// @param assets Amount of assets
    /// @return shares Equivalent amount of shares
    function convertToShares(uint256 assets) public view returns (uint256 shares) {
        uint256 supply = _totalSupply;
        return supply == 0 ? assets : (assets * supply) / _totalAssets;
    }

    /// @notice Convert shares to assets.
    /// @param shares Amount of shares
    /// @return assets Equivalent amount of assets
    function convertToAssets(uint256 shares) public view returns (uint256 assets) {
        uint256 supply = _totalSupply;
        return supply == 0 ? shares : (shares * _totalAssets) / supply;
    }

    /// @notice Maximum amount of assets that can be deposited in a single call.
    /// @return maxAssets Maximum deposit amount
    function maxDeposit(address) external pure returns (uint256 maxAssets) {
        return type(uint256).max;
    }

    /// @notice Preview the amount of shares that would be minted for a deposit.
    /// @param assets Amount of assets to deposit
    /// @return shares Amount of shares that would be minted
    function previewDeposit(uint256 assets) external view returns (uint256 shares) {
        return convertToShares(assets);
    }

    /// @notice Maximum amount of shares that can be minted in a single call.
    /// @return maxShares Maximum mint amount
    function maxMint(address) external pure returns (uint256 maxShares) {
        return type(uint256).max;
    }

    /// @notice Preview the amount of assets needed to mint a given amount of shares.
    /// @param shares Amount of shares to mint
    /// @return assets Amount of assets needed
    function previewMint(uint256 shares) external view returns (uint256 assets) {
        uint256 supply = _totalSupply;
        return supply == 0 ? shares : (shares * _totalAssets + supply - 1) / supply;
    }

    /// @notice Maximum amount of assets that can be withdrawn by the owner.
    /// @param owner_ Address that owns the shares
    /// @return maxAssets Maximum withdrawal amount
    function maxWithdraw(address owner_) external view returns (uint256 maxAssets) {
        return convertToAssets(balanceOf(owner_));
    }

    /// @notice Preview the amount of shares that would be burned for a withdrawal.
    /// @param assets Amount of assets to withdraw
    /// @return shares Amount of shares that would be burned
    function previewWithdraw(uint256 assets) external view returns (uint256 shares) {
        uint256 supply = _totalSupply;
        return supply == 0 ? assets : (assets * supply + _totalAssets - 1) / _totalAssets;
    }

    /// @notice Maximum amount of shares that can be redeemed by the owner.
    /// @param owner_ Address that owns the shares
    /// @return maxShares Maximum redemption amount
    function maxRedeem(address owner_) external view returns (uint256 maxShares) {
        return balanceOf(owner_);
    }

    /// @notice Preview the amount of assets that would be returned for redeeming shares.
    /// @param shares Amount of shares to redeem
    /// @return assets Amount of assets that would be returned
    function previewRedeem(uint256 shares) external view returns (uint256 assets) {
        return convertToAssets(shares);
    }

    // =============================================================
    //                    DEPOSIT/WITHDRAWAL MECHANISMS
    // =============================================================

    /// @notice Deposit assets and receive vault shares.
    /// @param assets Amount of assets to deposit
    /// @param receiver Address that will receive the shares
    /// @return shares Amount of shares minted
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "RWAVault: deposit amount is zero");
        require(receiver != address(0), "RWAVault: receiver is zero");

        shares = convertToShares(assets);
        require(shares > 0, "RWAVault: shares is zero");

        // Transfer assets from caller
        _transferAssetFrom(msg.sender, address(this), assets);

        // Update vault state
        _totalAssets += assets;
        _mint(receiver, shares);

        // Initialize high water mark on first deposit
        if (_highWaterMark == 0) {
            _highWaterMark = _totalAssets;
        }

        emit Deposit(msg.sender, receiver, assets, shares);
        return shares;
    }

    /// @notice Mint shares by depositing assets.
    /// @param shares Amount of shares to mint
    /// @param receiver Address that will receive the shares
    /// @return assets Amount of assets deposited
    function mint(uint256 shares, address receiver) external returns (uint256 assets) {
        require(shares > 0, "RWAVault: shares is zero");
        require(receiver != address(0), "RWAVault: receiver is zero");

        uint256 supply = _totalSupply;
        assets = supply == 0 ? shares : (shares * _totalAssets + supply - 1) / supply;
        require(assets > 0, "RWAVault: assets is zero");

        // Transfer assets from caller
        _transferAssetFrom(msg.sender, address(this), assets);

        // Update vault state
        _totalAssets += assets;
        _mint(receiver, shares);

        // Initialize high water mark on first deposit
        if (_highWaterMark == 0) {
            _highWaterMark = _totalAssets;
        }

        emit Deposit(msg.sender, receiver, assets, shares);
        return assets;
    }

    /// @notice Withdraw assets by burning shares.
    /// @param assets Amount of assets to withdraw
    /// @param receiver Address that will receive the assets
    /// @param owner_ Address that owns the shares
    /// @return shares Amount of shares burned
    function withdraw(uint256 assets, address receiver, address owner_)
        external
        returns (uint256 shares)
    {
        require(assets > 0, "RWAVault: assets is zero");
        require(receiver != address(0), "RWAVault: receiver is zero");
        require(owner_ != address(0), "RWAVault: owner is zero");

        uint256 supply = _totalSupply;
        shares = supply == 0 ? assets : (assets * supply + _totalAssets - 1) / _totalAssets;
        require(shares > 0, "RWAVault: shares is zero");

        // Check authorization
        if (msg.sender != owner_) {
            uint256 currentAllowance = _allowances[owner_][msg.sender];
            require(currentAllowance >= shares, "RWAVault: insufficient allowance");
            unchecked {
                _approve(owner_, msg.sender, currentAllowance - shares);
            }
        }

        // Burn shares
        _burn(owner_, shares);

        // Update vault state
        _totalAssets -= assets;

        // Transfer assets to receiver
        _transferAsset(receiver, assets);

        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
        return shares;
    }

    /// @notice Redeem shares for assets.
    /// @param shares Amount of shares to redeem
    /// @param receiver Address that will receive the assets
    /// @param owner_ Address that owns the shares
    /// @return assets Amount of assets returned
    function redeem(uint256 shares, address receiver, address owner_)
        external
        returns (uint256 assets)
    {
        require(shares > 0, "RWAVault: shares is zero");
        require(receiver != address(0), "RWAVault: receiver is zero");
        require(owner_ != address(0), "RWAVault: owner is zero");

        assets = convertToAssets(shares);
        require(assets > 0, "RWAVault: assets is zero");

        // Check authorization
        if (msg.sender != owner_) {
            uint256 currentAllowance = _allowances[owner_][msg.sender];
            require(currentAllowance >= shares, "RWAVault: insufficient allowance");
            unchecked {
                _approve(owner_, msg.sender, currentAllowance - shares);
            }
        }

        // Burn shares
        _burn(owner_, shares);

        // Update vault state
        _totalAssets -= assets;

        // Transfer assets to receiver
        _transferAsset(receiver, assets);

        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
        return assets;
    }

    // =============================================================
    //                      ERC-20 TRANSFERS
    // =============================================================

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "RWAVault: insufficient allowance");

        unchecked {
            _approve(from, msg.sender, currentAllowance - amount);
        }

        _transfer(from, to, amount);
        return true;
    }

    // =============================================================
    //                        FEE MANAGEMENT
    // =============================================================

    /// @notice Collect management and performance fees.
    /// @dev Can be called by owner or manager, typically on a schedule.
    function collectFees() external onlyOwnerOrManager {
        uint256 currentAssets = _totalAssets;
        if (currentAssets == 0) {
            lastFeeCollection = block.timestamp;
            return;
        }

        uint256 managementFee = 0;
        uint256 performanceFee = 0;

        // Calculate management fee (based on time elapsed)
        if (managementFeeBps > 0) {
            uint256 timeElapsed = block.timestamp - lastFeeCollection;
            if (timeElapsed > 0) {
                uint256 annualFee = (currentAssets * managementFeeBps) / FEE_DENOMINATOR;
                managementFee = (annualFee * timeElapsed) / 365 days;
            }
        }

        // Calculate performance fee (only if assets exceed high water mark)
        // Use high water mark before any fees are deducted
        if (performanceFeeBps > 0 && currentAssets > _highWaterMark) {
            uint256 profit = currentAssets - _highWaterMark;
            performanceFee = (profit * performanceFeeBps) / FEE_DENOMINATOR;
        }

        if (managementFee > 0 || performanceFee > 0) {
            uint256 totalFees = managementFee + performanceFee;
            require(totalFees <= currentAssets, "RWAVault: fees exceed assets");

            // Deduct fees from total assets
            _totalAssets -= totalFees;

            // Update high water mark (after fees are deducted)
            // For performance fee: new HWM = current assets after fees
            // For management fee only: new HWM = current assets after fees
            uint256 assetsAfterFees = currentAssets - totalFees;
            if (assetsAfterFees > _highWaterMark) {
                _highWaterMark = assetsAfterFees;
            }

            // Transfer fees to fee recipient
            _transferAsset(feeRecipient, totalFees);

            emit FeesCollected(managementFee, performanceFee);
        } else {
            // Even if no fees, update high water mark if assets increased
            if (currentAssets > _highWaterMark) {
                _highWaterMark = currentAssets;
            }
        }

        lastFeeCollection = block.timestamp;
    }

    /// @notice Update management fee.
    /// @param newFee New management fee in basis points
    function setManagementFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "RWAVault: fee too high");
        uint256 oldFee = managementFeeBps;
        managementFeeBps = newFee;
        emit ManagementFeeUpdated(oldFee, newFee);
    }

    /// @notice Update performance fee.
    /// @param newFee New performance fee in basis points
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "RWAVault: fee too high");
        uint256 oldFee = performanceFeeBps;
        performanceFeeBps = newFee;
        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    /// @notice Update fee recipient.
    /// @param newRecipient New fee recipient address
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "RWAVault: recipient is zero");
        address previous = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(previous, newRecipient);
    }

    /// @notice Update fee collection period.
    /// @param newPeriod New collection period in seconds
    function setFeeCollectionPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "RWAVault: period is zero");
        feeCollectionPeriod = newPeriod;
    }

    /// @notice Get the current high water mark.
    /// @return hwm High water mark value
    function highWaterMark() external view returns (uint256) {
        return _highWaterMark;
    }

    // =============================================================
    //                    ASSET ACCOUNTING
    // =============================================================

    /// @notice Update total assets (for external asset management).
    /// @dev Only owner can call this, typically after external investment returns.
    ///      Note: High water mark is NOT updated here - it's updated when fees are collected.
    /// @param newTotalAssets New total assets value
    function updateTotalAssets(uint256 newTotalAssets) external onlyOwner {
        _totalAssets = newTotalAssets;
        // High water mark is updated when fees are collected, not here
    }

    /// @notice Add assets to the vault (e.g., from investment returns).
    /// @param amount Amount of assets to add
    function addAssets(uint256 amount) external onlyOwner {
        require(amount > 0, "RWAVault: amount is zero");
        _transferAssetFrom(msg.sender, address(this), amount);
        _totalAssets += amount;

        // Update high water mark
        if (_totalAssets > _highWaterMark) {
            _highWaterMark = _totalAssets;
        }
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    function setManager(address newManager) external onlyOwner {
        require(newManager != address(0), "RWAVault: manager is zero");
        manager = newManager;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RWAVault: new owner is zero");
        owner = newOwner;
    }

    // =============================================================
    //                        INTERNAL HELPERS
    // =============================================================

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "RWAVault: transfer from zero");
        require(to != address(0), "RWAVault: transfer to zero");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "RWAVault: transfer exceeds balance");

        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    function _approve(address owner_, address spender, uint256 amount) internal {
        require(owner_ != address(0), "RWAVault: approve from zero");
        require(spender != address(0), "RWAVault: approve to zero");

        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "RWAVault: mint to zero");

        _totalSupply += amount;
        _balances[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "RWAVault: burn from zero");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "RWAVault: burn exceeds balance");

        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(from, address(0), amount);
    }

    /// @dev Transfer asset token from one address to another.
    function _transferAssetFrom(address from, address to, uint256 amount) private {
        // Using low-level call to handle any ERC-20 token
        (bool success, bytes memory data) = asset.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "RWAVault: transfer failed");
    }

    /// @dev Transfer asset token to an address.
    function _transferAsset(address to, uint256 amount) private {
        // Using low-level call to handle any ERC-20 token
        (bool success, bytes memory data) = asset.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "RWAVault: transfer failed");
    }
}

