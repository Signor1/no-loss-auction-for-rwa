// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./RWAIdentityRegistry.sol";

/// @title RWATREXToken
/// @notice ERC-3643 T-REX compliant security token with built-in compliance,
///         identity registry integration, transfer rules engine, and on-chain
///         compliance checks.
/// @dev This token implements a comprehensive compliance framework for security
///      tokens, ensuring all transfers meet regulatory requirements.
contract RWATREXToken {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    event Paused(address indexed account);
    event Unpaused(address indexed account);

    event TransferRuleAdded(uint256 indexed ruleId, string description);
    event TransferRuleUpdated(uint256 indexed ruleId, string description);
    event TransferRuleRemoved(uint256 indexed ruleId);
    event TransferRuleEnabled(uint256 indexed ruleId, bool enabled);

    event ComplianceCheckFailed(address indexed from, address indexed to, uint256 indexed ruleId, string reason);
    event ComplianceCheckPassed(address indexed from, address indexed to);

    // =============================================================
    //                        TRANSFER RULES
    // =============================================================

    enum RuleType {
        KYC_REQUIRED, // Both parties must have KYC
        AML_REQUIRED, // Both parties must have AML
        ACCREDITED_ONLY, // Only accredited investors can receive
        COUNTRY_RESTRICTED, // Restrict certain countries
        MIN_BALANCE, // Minimum balance requirement
        MAX_TRANSFER, // Maximum transfer amount
        CUSTOM // Custom rule via compliance data
    }

    struct TransferRule {
        uint256 ruleId;
        RuleType ruleType;
        string description;
        bool enabled;
        bytes data; // Rule-specific data (encoded parameters)
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    // ERC-20 Core
    string private _name;
    string private _symbol;
    uint8 private immutable _decimals;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Identity Registry
    RWAIdentityRegistry public immutable identityRegistry;

    // Transfer Rules Engine
    mapping(uint256 => TransferRule) private _transferRules;
    uint256[] private _activeRuleIds;
    uint256 private _nextRuleId;

    // Rule-specific storage
    mapping(string => bool) private _restrictedCountries; // Country codes that are restricted
    mapping(address => uint256) private _minBalances; // Minimum balance per address
    mapping(address => uint256) private _maxTransferAmounts; // Max transfer per address

    // Access Control
    address public owner;
    address public complianceAdmin;

    // Pausable
    bool private _paused;

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "RWATREX: caller is not owner");
        _;
    }

    modifier onlyOwnerOrCompliance() {
        require(msg.sender == owner || msg.sender == complianceAdmin, "RWATREX: not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "RWATREX: paused");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @param name_ Token name
    /// @param symbol_ Token symbol
    /// @param decimals_ Number of decimals
    /// @param initialOwner Contract owner
    /// @param registry_ Address of the identity registry
    /// @param initialSupply Initial token supply
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address initialOwner,
        address registry_,
        uint256 initialSupply
    ) {
        require(initialOwner != address(0), "RWATREX: owner is zero");
        require(registry_ != address(0), "RWATREX: registry is zero");

        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        owner = initialOwner;
        complianceAdmin = initialOwner;

        identityRegistry = RWAIdentityRegistry(registry_);

        _mint(initialOwner, initialSupply);

        // Initialize default transfer rules
        _initializeDefaultRules();
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

    function transferFrom(address from, address to, uint256 amount)
        external
        whenNotPaused
        returns (bool)
    {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "RWATREX: insufficient allowance");

        unchecked {
            _approve(from, msg.sender, currentAllowance - amount);
        }

        _transfer(from, to, amount);
        return true;
    }

    // =============================================================
    //                    TRANSFER RULES ENGINE
    // =============================================================

    /// @notice Add a new transfer rule.
    /// @param ruleType Type of rule
    /// @param description Human-readable description
    /// @param data Rule-specific encoded data
    /// @return ruleId ID of the newly created rule
    function addTransferRule(
        RuleType ruleType,
        string calldata description,
        bytes calldata data
    ) external onlyOwnerOrCompliance returns (uint256 ruleId) {
        ruleId = _nextRuleId++;
        _transferRules[ruleId] = TransferRule({
            ruleId: ruleId,
            ruleType: ruleType,
            description: description,
            enabled: true,
            data: data
        });

        _activeRuleIds.push(ruleId);

        emit TransferRuleAdded(ruleId, description);
        return ruleId;
    }

    /// @notice Update an existing transfer rule.
    /// @param ruleId ID of the rule to update
    /// @param description New description
    /// @param data New rule data
    function updateTransferRule(
        uint256 ruleId,
        string calldata description,
        bytes calldata data
    ) external onlyOwnerOrCompliance {
        require(_transferRules[ruleId].ruleId == ruleId, "RWATREX: rule does not exist");

        _transferRules[ruleId].description = description;
        _transferRules[ruleId].data = data;

        emit TransferRuleUpdated(ruleId, description);
    }

    /// @notice Enable or disable a transfer rule.
    /// @param ruleId ID of the rule
    /// @param enabled Whether to enable the rule
    function setTransferRuleEnabled(uint256 ruleId, bool enabled) external onlyOwnerOrCompliance {
        require(_transferRules[ruleId].ruleId == ruleId, "RWATREX: rule does not exist");
        _transferRules[ruleId].enabled = enabled;
        emit TransferRuleEnabled(ruleId, enabled);
    }

    /// @notice Remove a transfer rule.
    /// @param ruleId ID of the rule to remove
    function removeTransferRule(uint256 ruleId) external onlyOwnerOrCompliance {
        require(_transferRules[ruleId].ruleId == ruleId, "RWATREX: rule does not exist");

        delete _transferRules[ruleId];

        // Remove from active list
        uint256 length = _activeRuleIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (_activeRuleIds[i] == ruleId) {
                _activeRuleIds[i] = _activeRuleIds[length - 1];
                _activeRuleIds.pop();
                break;
            }
        }

        emit TransferRuleRemoved(ruleId);
    }

    /// @notice Get transfer rule information.
    /// @param ruleId ID of the rule
    /// @return rule Transfer rule struct
    function getTransferRule(uint256 ruleId) external view returns (TransferRule memory) {
        return _transferRules[ruleId];
    }

    /// @notice Get all active rule IDs.
    /// @return ruleIds Array of active rule IDs
    function getActiveRuleIds() external view returns (uint256[] memory) {
        return _activeRuleIds;
    }

    /// @notice Get number of active rules.
    /// @return count Number of active rules
    function getActiveRuleCount() external view returns (uint256) {
        return _activeRuleIds.length;
    }

    // =============================================================
    //                    ON-CHAIN COMPLIANCE CHECKS
    // =============================================================

    /// @notice Check if a transfer would be compliant.
    /// @param from Sender address
    /// @param to Recipient address
    /// @param amount Transfer amount
    /// @return compliant Whether transfer is compliant
    /// @return reason Reason if not compliant
    function checkCompliance(address from, address to, uint256 amount)
        public
        view
        returns (bool compliant, string memory reason)
    {
        // Check all active rules
        for (uint256 i = 0; i < _activeRuleIds.length; i++) {
            uint256 ruleId = _activeRuleIds[i];
            TransferRule memory rule = _transferRules[ruleId];

            if (!rule.enabled) {
                continue;
            }

            (bool ruleCompliant, string memory ruleReason) =
                _checkRule(rule, from, to, amount);

            if (!ruleCompliant) {
                return (false, ruleReason);
            }
        }

        return (true, "");
    }

    /// @notice Internal function to check a specific rule.
    function _checkRule(TransferRule memory rule, address from, address to, uint256 amount)
        internal
        view
        returns (bool compliant, string memory reason)
    {
        if (rule.ruleType == RuleType.KYC_REQUIRED) {
            if (!identityRegistry.isKYCVerified(from) || !identityRegistry.isKYCVerified(to)) {
                return (false, "KYC verification required");
            }
        } else if (rule.ruleType == RuleType.AML_REQUIRED) {
            if (!identityRegistry.isAMLVerified(from) || !identityRegistry.isAMLVerified(to)) {
                return (false, "AML verification required");
            }
        } else if (rule.ruleType == RuleType.ACCREDITED_ONLY) {
            if (!identityRegistry.isAccredited(to)) {
                return (false, "Recipient must be accredited");
            }
        } else if (rule.ruleType == RuleType.COUNTRY_RESTRICTED) {
            string memory fromCountry = identityRegistry.getCountry(from);
            string memory toCountry = identityRegistry.getCountry(to);

            if (_restrictedCountries[fromCountry] || _restrictedCountries[toCountry]) {
                return (false, "Country restriction");
            }
        } else if (rule.ruleType == RuleType.MIN_BALANCE) {
            uint256 minBalance = _minBalances[to];
            if (minBalance > 0 && _balances[to] + amount < minBalance) {
                return (false, "Minimum balance requirement");
            }
        } else if (rule.ruleType == RuleType.MAX_TRANSFER) {
            uint256 maxTransfer = _maxTransferAmounts[from];
            if (maxTransfer > 0 && amount > maxTransfer) {
                return (false, "Maximum transfer exceeded");
            }
        } else if (rule.ruleType == RuleType.CUSTOM) {
            // Custom rule logic can be implemented via compliance data
            // This is a placeholder for extensibility
            bytes32 complianceKey = abi.decode(rule.data, (bytes32));
            bytes32 fromData = identityRegistry.getComplianceData(from, complianceKey);
            bytes32 toData = identityRegistry.getComplianceData(to, complianceKey);

            if (fromData == bytes32(0) || toData == bytes32(0)) {
                return (false, "Custom compliance check failed");
            }
        }

        return (true, "");
    }

    // =============================================================
    //                    RULE CONFIGURATION
    // =============================================================

    /// @notice Set restricted countries.
    /// @param country Country code
    /// @param restricted Whether country is restricted
    function setRestrictedCountry(string calldata country, bool restricted)
        external
        onlyOwnerOrCompliance
    {
        _restrictedCountries[country] = restricted;
    }

    /// @notice Check if a country is restricted.
    /// @param country Country code
    /// @return restricted Whether country is restricted
    function isCountryRestricted(string calldata country) external view returns (bool) {
        return _restrictedCountries[country];
    }

    /// @notice Set minimum balance requirement for an address.
    /// @param account Address
    /// @param minBalance Minimum balance
    function setMinBalance(address account, uint256 minBalance) external onlyOwnerOrCompliance {
        _minBalances[account] = minBalance;
    }

    /// @notice Set maximum transfer amount for an address.
    /// @param account Address
    /// @param maxAmount Maximum transfer amount
    function setMaxTransferAmount(address account, uint256 maxAmount)
        external
        onlyOwnerOrCompliance
    {
        _maxTransferAmounts[account] = maxAmount;
    }

    // =============================================================
    //                        MINT & BURN
    // =============================================================

    function mint(address to, uint256 amount) external onlyOwnerOrCompliance whenNotPaused {
        _mint(to, amount);
    }

    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external whenNotPaused {
        uint256 currentAllowance = _allowances[account][msg.sender];
        require(currentAllowance >= amount, "RWATREX: burn exceeds allowance");

        unchecked {
            _approve(account, msg.sender, currentAllowance - amount);
        }

        _burn(account, amount);
    }

    // =============================================================
    //                    PAUSABLE CONTROL
    // =============================================================

    function paused() external view returns (bool) {
        return _paused;
    }

    function pause() external onlyOwnerOrCompliance {
        require(!_paused, "RWATREX: already paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwnerOrCompliance {
        require(_paused, "RWATREX: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    function setComplianceAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "RWATREX: admin is zero");
        complianceAdmin = newAdmin;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RWATREX: new owner is zero");
        owner = newOwner;
    }

    // =============================================================
    //                        INTERNAL HELPERS
    // =============================================================

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "RWATREX: transfer from zero");
        require(to != address(0), "RWATREX: transfer to zero");
        require(amount > 0, "RWATREX: amount is zero");

        // On-chain compliance check
        (bool compliant, string memory reason) = checkCompliance(from, to, amount);
        if (!compliant) {
            emit ComplianceCheckFailed(from, to, 0, reason);
            revert(string(abi.encodePacked("RWATREX: compliance check failed: ", reason)));
        }

        emit ComplianceCheckPassed(from, to);

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "RWATREX: transfer exceeds balance");

        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    function _approve(address owner_, address spender, uint256 amount) internal {
        require(owner_ != address(0), "RWATREX: approve from zero");
        require(spender != address(0), "RWATREX: approve to zero");

        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "RWATREX: mint to zero");
        require(amount > 0, "RWATREX: amount is zero");

        _totalSupply += amount;
        _balances[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "RWATREX: burn from zero");
        require(amount > 0, "RWATREX: amount is zero");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "RWATREX: burn exceeds balance");

        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(from, address(0), amount);
    }

    /// @notice Initialize default transfer rules.
    function _initializeDefaultRules() internal {
        // Rule 0: KYC Required
        uint256 ruleId0 = _nextRuleId++;
        _transferRules[ruleId0] = TransferRule({
            ruleId: ruleId0,
            ruleType: RuleType.KYC_REQUIRED,
            description: "Both parties must have KYC verification",
            enabled: true,
            data: ""
        });
        _activeRuleIds.push(ruleId0);

        // Rule 1: AML Required
        uint256 ruleId1 = _nextRuleId++;
        _transferRules[ruleId1] = TransferRule({
            ruleId: ruleId1,
            ruleType: RuleType.AML_REQUIRED,
            description: "Both parties must have AML verification",
            enabled: true,
            data: ""
        });
        _activeRuleIds.push(ruleId1);
    }
}

