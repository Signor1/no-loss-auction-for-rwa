pragma solidity 0.8.23;

/// @title AccessControlRegistry
/// @notice Centralized Role-Based Access Control (RBAC) registry.
contract AccessControlRegistry {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    // =============================================================
    //                          ROLES
    // =============================================================

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");

    // =============================================================
    //                          STORAGE
    // =============================================================

    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(bytes32 => bytes32) private _roleAdmins;

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: missing role");
        _;
    }

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "AccessControl: zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        
        // Setup hierarchy
        // Default Admin manages all roles by default
    }

    // =============================================================
    //                    PUBLIC FUNCTIONS
    // =============================================================

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function getRoleAdmin(bytes32 role) public view returns (bytes32) {
        return _roleAdmins[role];
    }

    function grantRole(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account) external {
        require(account == msg.sender, "AccessControl: can only renounce for self");
        _revokeRole(role, account);
    }

    function setRoleAdmin(bytes32 role, bytes32 adminRole) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roleAdmins[role] = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    // =============================================================
    //                       INTERNAL LOGIC
    // =============================================================

    function _grantRole(bytes32 role, address account) internal {
        if (!hasRole(role, account)) {
            _roles[role][account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function _revokeRole(bytes32 role, address account) internal {
        if (hasRole(role, account)) {
            _roles[role][account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }
}
