// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title RWAIdentityRegistry
/// @notice Identity registry for ERC-3643 T-REX tokens, managing investor identity,
///         KYC/AML status, accreditation, and compliance data.
/// @dev This registry stores on-chain identity information and compliance status
///      for investors participating in security token offerings.
contract RWAIdentityRegistry {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event IdentityRegistered(address indexed investor, bytes32 indexed identityHash);
    event IdentityUpdated(address indexed investor, bytes32 indexed newIdentityHash);
    event IdentityRemoved(address indexed investor);
    event KYCStatusUpdated(address indexed investor, bool kycVerified);
    event AMLStatusUpdated(address indexed investor, bool amlVerified);
    event AccreditationStatusUpdated(address indexed investor, bool accredited);
    event CountryUpdated(address indexed investor, string country);
    event ComplianceDataUpdated(address indexed investor, bytes32 indexed key, bytes32 value);
    event RegistryAdminUpdated(address indexed previousAdmin, address indexed newAdmin);
    event ComplianceOfficerUpdated(address indexed previousOfficer, address indexed newOfficer);

    // =============================================================
    //                        IDENTITY STRUCT
    // =============================================================

    struct Identity {
        bytes32 identityHash; // Hash of identity documents/information
        bool kycVerified; // KYC verification status
        bool amlVerified; // AML screening status
        bool accredited; // Accredited investor status
        string country; // Country/jurisdiction code (ISO 3166-1 alpha-2)
        uint256 registrationDate; // Timestamp of registration
        uint256 lastUpdateDate; // Timestamp of last update
        bool exists; // Whether identity exists
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    // Mapping from investor address to identity information
    mapping(address => Identity) private _identities;

    // Mapping from investor address to custom compliance data (key => value)
    mapping(address => mapping(bytes32 => bytes32)) private _complianceData;

    // List of all registered investor addresses
    address[] private _registeredInvestors;

    // Mapping to track if address is in the list
    mapping(address => bool) private _isRegistered;

    // =============================================================
    //                       ACCESS CONTROL
    // =============================================================

    address public registryAdmin;
    address public complianceOfficer;

    modifier onlyAdmin() {
        require(msg.sender == registryAdmin, "RWAIR: caller is not admin");
        _;
    }

    modifier onlyAdminOrCompliance() {
        require(
            msg.sender == registryAdmin || msg.sender == complianceOfficer,
            "RWAIR: not authorized"
        );
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "RWAIR: admin is zero");
        registryAdmin = initialAdmin;
        complianceOfficer = initialAdmin;
    }

    // =============================================================
    //                    IDENTITY REGISTRATION
    // =============================================================

    /// @notice Register a new investor identity.
    /// @param investor Address of the investor
    /// @param identityHash Hash of identity documents/information
    /// @param country Country/jurisdiction code (ISO 3166-1 alpha-2)
    function registerIdentity(
        address investor,
        bytes32 identityHash,
        string calldata country
    ) external onlyAdminOrCompliance {
        require(investor != address(0), "RWAIR: investor is zero");
        require(identityHash != bytes32(0), "RWAIR: identity hash is zero");
        require(!_identities[investor].exists, "RWAIR: identity already exists");

        _identities[investor] = Identity({
            identityHash: identityHash,
            kycVerified: false,
            amlVerified: false,
            accredited: false,
            country: country,
            registrationDate: block.timestamp,
            lastUpdateDate: block.timestamp,
            exists: true
        });

        if (!_isRegistered[investor]) {
            _registeredInvestors.push(investor);
            _isRegistered[investor] = true;
        }

        emit IdentityRegistered(investor, identityHash);
    }

    /// @notice Update an existing investor identity.
    /// @param investor Address of the investor
    /// @param newIdentityHash New hash of identity documents
    function updateIdentity(address investor, bytes32 newIdentityHash)
        external
        onlyAdminOrCompliance
    {
        require(investor != address(0), "RWAIR: investor is zero");
        require(newIdentityHash != bytes32(0), "RWAIR: identity hash is zero");
        require(_identities[investor].exists, "RWAIR: identity does not exist");

        _identities[investor].identityHash = newIdentityHash;
        _identities[investor].lastUpdateDate = block.timestamp;

        emit IdentityUpdated(investor, newIdentityHash);
    }

    /// @notice Remove an investor identity from the registry.
    /// @param investor Address of the investor
    function removeIdentity(address investor) external onlyAdmin {
        require(_identities[investor].exists, "RWAIR: identity does not exist");

        delete _identities[investor];
        // Note: _complianceData mapping entries remain but are effectively orphaned

        // Remove from list (swap with last element and pop)
        if (_isRegistered[investor]) {
            uint256 length = _registeredInvestors.length;
            for (uint256 i = 0; i < length; i++) {
                if (_registeredInvestors[i] == investor) {
                    _registeredInvestors[i] = _registeredInvestors[length - 1];
                    _registeredInvestors.pop();
                    _isRegistered[investor] = false;
                    break;
                }
            }
        }

        emit IdentityRemoved(investor);
    }

    // =============================================================
    //                    KYC/AML STATUS MANAGEMENT
    // =============================================================

    /// @notice Set KYC verification status for an investor.
    /// @param investor Address of the investor
    /// @param verified Whether KYC is verified
    function setKYCStatus(address investor, bool verified) external onlyAdminOrCompliance {
        require(_identities[investor].exists, "RWAIR: identity does not exist");
        _identities[investor].kycVerified = verified;
        _identities[investor].lastUpdateDate = block.timestamp;
        emit KYCStatusUpdated(investor, verified);
    }

    /// @notice Set AML verification status for an investor.
    /// @param investor Address of the investor
    /// @param verified Whether AML screening passed
    function setAMLStatus(address investor, bool verified) external onlyAdminOrCompliance {
        require(_identities[investor].exists, "RWAIR: identity does not exist");
        _identities[investor].amlVerified = verified;
        _identities[investor].lastUpdateDate = block.timestamp;
        emit AMLStatusUpdated(investor, verified);
    }

    /// @notice Set both KYC and AML status in one transaction.
    /// @param investor Address of the investor
    /// @param kycVerified KYC verification status
    /// @param amlVerified AML verification status
    function setKYCAMLStatus(address investor, bool kycVerified, bool amlVerified)
        external
        onlyAdminOrCompliance
    {
        require(_identities[investor].exists, "RWAIR: identity does not exist");
        _identities[investor].kycVerified = kycVerified;
        _identities[investor].amlVerified = amlVerified;
        _identities[investor].lastUpdateDate = block.timestamp;
        emit KYCStatusUpdated(investor, kycVerified);
        emit AMLStatusUpdated(investor, amlVerified);
    }

    // =============================================================
    //                   ACCREDITATION MANAGEMENT
    // =============================================================

    /// @notice Set accredited investor status.
    /// @param investor Address of the investor
    /// @param accredited Whether investor is accredited
    function setAccreditationStatus(address investor, bool accredited)
        external
        onlyAdminOrCompliance
    {
        require(_identities[investor].exists, "RWAIR: identity does not exist");
        _identities[investor].accredited = accredited;
        _identities[investor].lastUpdateDate = block.timestamp;
        emit AccreditationStatusUpdated(investor, accredited);
    }

    // =============================================================
    //                    COUNTRY/JURISDICTION
    // =============================================================

    /// @notice Update investor's country/jurisdiction.
    /// @param investor Address of the investor
    /// @param country Country code (ISO 3166-1 alpha-2)
    function setCountry(address investor, string calldata country)
        external
        onlyAdminOrCompliance
    {
        require(_identities[investor].exists, "RWAIR: identity does not exist");
        _identities[investor].country = country;
        _identities[investor].lastUpdateDate = block.timestamp;
        emit CountryUpdated(investor, country);
    }

    // =============================================================
    //                    COMPLIANCE DATA
    // =============================================================

    /// @notice Set custom compliance data for an investor.
    /// @param investor Address of the investor
    /// @param key Key for the compliance data
    /// @param value Value to store
    function setComplianceData(address investor, bytes32 key, bytes32 value)
        external
        onlyAdminOrCompliance
    {
        require(_identities[investor].exists, "RWAIR: identity does not exist");
        _complianceData[investor][key] = value;
        emit ComplianceDataUpdated(investor, key, value);
    }

    /// @notice Get custom compliance data for an investor.
    /// @param investor Address of the investor
    /// @param key Key for the compliance data
    /// @return value Stored value
    function getComplianceData(address investor, bytes32 key)
        external
        view
        returns (bytes32 value)
    {
        return _complianceData[investor][key];
    }

    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================

    /// @notice Get full identity information for an investor.
    /// @param investor Address of the investor
    /// @return identity Full identity struct
    function getIdentity(address investor) external view returns (Identity memory identity) {
        return _identities[investor];
    }

    /// @notice Check if an investor is registered.
    /// @param investor Address of the investor
    /// @return exists Whether identity exists
    function isRegistered(address investor) external view returns (bool) {
        return _identities[investor].exists;
    }

    /// @notice Check if an investor has passed KYC.
    /// @param investor Address of the investor
    /// @return verified KYC verification status
    function isKYCVerified(address investor) external view returns (bool) {
        return _identities[investor].kycVerified;
    }

    /// @notice Check if an investor has passed AML screening.
    /// @param investor Address of the investor
    /// @return verified AML verification status
    function isAMLVerified(address investor) external view returns (bool) {
        return _identities[investor].amlVerified;
    }

    /// @notice Check if an investor is accredited.
    /// @param investor Address of the investor
    /// @return accredited Accreditation status
    function isAccredited(address investor) external view returns (bool) {
        return _identities[investor].accredited;
    }

    /// @notice Get investor's country/jurisdiction.
    /// @param investor Address of the investor
    /// @return country Country code
    function getCountry(address investor) external view returns (string memory) {
        return _identities[investor].country;
    }

    /// @notice Check if an investor is compliant (KYC + AML verified).
    /// @param investor Address of the investor
    /// @return compliant Whether investor is fully compliant
    function isCompliant(address investor) external view returns (bool) {
        Identity memory identity = _identities[investor];
        return identity.exists && identity.kycVerified && identity.amlVerified;
    }

    /// @notice Get total number of registered investors.
    /// @return count Number of registered investors
    function getRegisteredInvestorCount() external view returns (uint256) {
        return _registeredInvestors.length;
    }

    /// @notice Get registered investor at index.
    /// @param index Index in the list
    /// @return investor Address of the investor
    function getRegisteredInvestor(uint256 index) external view returns (address) {
        require(index < _registeredInvestors.length, "RWAIR: index out of bounds");
        return _registeredInvestors[index];
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    /// @notice Update the registry admin.
    /// @param newAdmin New admin address
    function setRegistryAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "RWAIR: admin is zero");
        address previous = registryAdmin;
        registryAdmin = newAdmin;
        emit RegistryAdminUpdated(previous, newAdmin);
    }

    /// @notice Update the compliance officer.
    /// @param newOfficer New compliance officer address
    function setComplianceOfficer(address newOfficer) external onlyAdmin {
        require(newOfficer != address(0), "RWAIR: officer is zero");
        address previous = complianceOfficer;
        complianceOfficer = newOfficer;
        emit ComplianceOfficerUpdated(previous, newOfficer);
    }
}

