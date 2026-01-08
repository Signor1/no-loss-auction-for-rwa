// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title OffChainVerifier
/// @notice Manages off-chain data verification (IPFS, API, Documents) via multi-oracle consensus.
contract OffChainVerifier {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event VerificationRequested(bytes32 indexed requestId, uint256 indexed assetId, VerificationType vType, string data);
    event VerificationFulfilled(bytes32 indexed requestId, address indexed oracle, bool isValid);
    event VerificationCompleted(bytes32 indexed requestId, uint256 indexed assetId, bool finalResult);
    event OracleAuthorized(address indexed oracle);
    event OracleDeauthorized(address indexed oracle);

    // =============================================================
    //                          STRUCTS
    // =============================================================

    enum VerificationType {
        IPFS_CHECK,
        API_DATA,
        DOCUMENT_AUTH
    }

    struct VerificationRequest {
        uint256 assetId;
        VerificationType vType;
        string data; // Content to verify (e.g., URL, Hash)
        uint256 approvals;
        uint256 rejections;
        uint256 timestamp;
        bool completed;
        bool finalResult;
    }

    struct VerificationResult {
        bool isValid;
        uint256 timestamp;
        uint256 expiry;
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    mapping(bytes32 => VerificationRequest) public requests;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    // assetId => VerificationType => Result
    mapping(uint256 => mapping(VerificationType => VerificationResult)) public verificationResults;
    
    mapping(address => bool) public authorizedOracles;
    uint256 public oracleCount;
    uint256 public requiredConsensus = 2; // Default M
    
    address public admin;
    uint256 private nonce;

    uint256 public constant DEFAULT_EXPIRY = 30 days;

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "OffChainVerifier: not admin");
        _;
    }

    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "OffChainVerifier: not oracle");
        _;
    }

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor() {
        admin = msg.sender;
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    function addOracle(address oracle) external onlyAdmin {
        require(oracle != address(0), "OffChainVerifier: zero address");
        require(!authorizedOracles[oracle], "OffChainVerifier: already authorized");
        
        authorizedOracles[oracle] = true;
        oracleCount++;
        emit OracleAuthorized(oracle);
    }

    function removeOracle(address oracle) external onlyAdmin {
        require(authorizedOracles[oracle], "OffChainVerifier: not authorized");
        
        authorizedOracles[oracle] = false;
        oracleCount--;
        emit OracleDeauthorized(oracle);
    }

    function setRequiredConsensus(uint256 _required) external onlyAdmin {
        require(_required > 0, "OffChainVerifier: invalid consensus");
        requiredConsensus = _required;
    }

    // =============================================================
    //                    VERIFICATION FLOW
    // =============================================================

    /// @notice Request verification of off-chain data.
    /// @return requestId Unique ID for the request.
    function requestVerification(uint256 assetId, VerificationType vType, string calldata data) external returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(assetId, vType, data, block.timestamp, nonce++));
        
        requests[requestId] = VerificationRequest({
            assetId: assetId,
            vType: vType,
            data: data,
            approvals: 0,
            rejections: 0,
            timestamp: block.timestamp,
            completed: false,
            finalResult: false
        });

        emit VerificationRequested(requestId, assetId, vType, data);
        return requestId;
    }

    /// @notice Fulfill a verification request (Oracle only).
    function fulfillVerification(bytes32 requestId, bool isValid) external onlyOracle {
        VerificationRequest storage req = requests[requestId];
        require(req.timestamp > 0, "OffChainVerifier: request not found");
        require(!req.completed, "OffChainVerifier: request completed");
        require(!hasVoted[requestId][msg.sender], "OffChainVerifier: already voted");

        hasVoted[requestId][msg.sender] = true;

        if (isValid) {
            req.approvals++;
        } else {
            req.rejections++;
        }

        emit VerificationFulfilled(requestId, msg.sender, isValid);

        _checkConsensus(requestId);
    }

    function _checkConsensus(bytes32 requestId) internal {
        VerificationRequest storage req = requests[requestId];
        
        if (req.approvals >= requiredConsensus) {
            req.completed = true;
            req.finalResult = true;
            
            verificationResults[req.assetId][req.vType] = VerificationResult({
                isValid: true,
                timestamp: block.timestamp,
                expiry: block.timestamp + DEFAULT_EXPIRY
            });
            
            emit VerificationCompleted(requestId, req.assetId, true);
        } else if (req.rejections >= requiredConsensus) { // Or some rejection threshold
             req.completed = true;
             req.finalResult = false;
             
             // Optionally record negative result or just fail
             emit VerificationCompleted(requestId, req.assetId, false);
        }
    }

    // =============================================================
    //                    VIEW FUNCTIONS
    // =============================================================

    function isVerified(uint256 assetId, VerificationType vType) external view returns (bool) {
        VerificationResult memory res = verificationResults[assetId][vType];
        return res.isValid && res.expiry > block.timestamp;
    }
}
