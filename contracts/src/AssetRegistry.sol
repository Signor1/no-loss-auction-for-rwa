// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./RWAAssetNFT.sol";

/// @title AssetRegistry
/// @notice Manages the registration, verification, and minting of Real World Assets (RWAs).
/// @dev Implements a multi-signature approval process for asset onboarding.
contract AssetRegistry {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event AssetRegistered(uint256 indexed assetId, address indexed issuer, string ipfsHash);
    event AssetApproved(uint256 indexed assetId, address indexed verifier);
    event AssetFinalized(uint256 indexed assetId, uint256 indexed nftId, address indexed minter);
    event AssetRejected(uint256 indexed assetId, address indexed verifier, string reason);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // =============================================================
    //                          STRUCTS
    // =============================================================

    enum AssetStatus {
        Pending,
        Approved,
        Rejected,
        Delisted
    }

    struct AssetDetails {
        uint256 assetId;
        address issuer;
        string ipfsHash; // Points to off-chain metadata (legal docs, etc.)
        uint256 value; // Estimated value of the asset
        AssetStatus status;
        uint256 approvalCount;
        uint256 nftId; // Non-zero if minted
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    RWAAssetNFT public immutable assetNFT;

    mapping(uint256 => AssetDetails) public assets;
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    
    address[] public verifiers;
    mapping(address => bool) public isVerifier;

    uint256 public requiredApprovals;
    uint256 private _nextAssetId = 1;

    address public admin;

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "AssetRegistry: not admin");
        _;
    }

    modifier onlyVerifier() {
        require(isVerifier[msg.sender], "AssetRegistry: not verifier");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(
        address _assetNFT, 
        address[] memory _verifiers, 
        uint256 _requiredApprovals
    ) {
        require(_assetNFT != address(0), "AssetRegistry: zero address");
        require(_requiredApprovals > 0, "AssetRegistry: invalid required approvals");
        require(_requiredApprovals <= _verifiers.length, "AssetRegistry: required > verifiers");

        admin = msg.sender;
        assetNFT = RWAAssetNFT(_assetNFT);
        requiredApprovals = _requiredApprovals;

        for (uint256 i = 0; i < _verifiers.length; i++) {
            _addVerifier(_verifiers[i]);
        }
    }

    // =============================================================
    //                     REGISTRATION FLOW
    // =============================================================

    /// @notice Register a new asset for onboarding.
    /// @param ipfsHash IPFS hash of asset metadata/documents
    /// @param value Estimated value of the asset
    function registerAsset(string calldata ipfsHash, uint256 value) external returns (uint256) {
        uint256 assetId = _nextAssetId++;
        
        assets[assetId] = AssetDetails({
            assetId: assetId,
            issuer: msg.sender,
            ipfsHash: ipfsHash,
            value: value,
            status: AssetStatus.Pending,
            approvalCount: 0,
            nftId: 0
        });

        emit AssetRegistered(assetId, msg.sender, ipfsHash);
        return assetId;
    }

    /// @notice Approve an asset (Verifier only).
    /// @param assetId ID of the asset to approve
    function approveAsset(uint256 assetId) external onlyVerifier {
        AssetDetails storage asset = assets[assetId];
        require(asset.status == AssetStatus.Pending, "AssetRegistry: not pending");
        require(!hasApproved[assetId][msg.sender], "AssetRegistry: already approved");

        hasApproved[assetId][msg.sender] = true;
        asset.approvalCount++;

        emit AssetApproved(assetId, msg.sender);
    }

    /// @notice Finalize asset and mint NFT (if requirements met).
    /// @param assetId ID of the asset to finalize
    function finalizeAsset(uint256 assetId) external {
        AssetDetails storage asset = assets[assetId];
        require(asset.status == AssetStatus.Pending, "AssetRegistry: not pending");
        require(asset.approvalCount >= requiredApprovals, "AssetRegistry: insufficient approvals");

        asset.status = AssetStatus.Approved;
        
        // Mint NFT to issuer
        // Note: The AssetRegistry must be authorized to mint on the RWAAssetNFT contract
        // We use the same ID for NFT as the assetId for simplicity, or we could let the NFT contract decide.
        // But RWAAssetNFT.mint takes tokenId as input.
        uint256 nftId = assetId; 
        asset.nftId = nftId;
        
        assetNFT.mint(asset.issuer, nftId);
        assetNFT.setTokenURI(nftId, asset.ipfsHash);

        emit AssetFinalized(assetId, nftId, msg.sender);
    }

    /// @notice Reject an asset (Verifier or Admin only).
    /// @param assetId ID of the asset to reject
    /// @param reason Reason for rejection
    function rejectAsset(uint256 assetId, string calldata reason) external {
        require(msg.sender == admin || isVerifier[msg.sender], "AssetRegistry: unauthorized");
        AssetDetails storage asset = assets[assetId];
        require(asset.status == AssetStatus.Pending, "AssetRegistry: not pending");

        asset.status = AssetStatus.Rejected;
        emit AssetRejected(assetId, msg.sender, reason);
    }

    // =============================================================
    //                       ADMIN FUNCTIONS
    // =============================================================

    function addVerifier(address verifier) external onlyAdmin {
        _addVerifier(verifier);
    }

    function removeVerifier(address verifier) external onlyAdmin {
        require(isVerifier[verifier], "AssetRegistry: not a verifier");
        isVerifier[verifier] = false;
        
        // Remove from list
        for (uint256 i = 0; i < verifiers.length; i++) {
            if (verifiers[i] == verifier) {
                verifiers[i] = verifiers[verifiers.length - 1];
                verifiers.pop();
                break;
            }
        }
        
        require(verifiers.length >= requiredApprovals, "AssetRegistry: too few verifiers");
        emit VerifierRemoved(verifier);
    }

    function setRequiredApprovals(uint256 _requiredApprovals) external onlyAdmin {
        require(_requiredApprovals > 0, "AssetRegistry: invalid required approvals");
        require(_requiredApprovals <= verifiers.length, "AssetRegistry: required > verifiers");
        requiredApprovals = _requiredApprovals;
    }

    // =============================================================
    //                    LIFECYCLE MANAGEMENT EVENTS
    // =============================================================

    event UpdateProposed(uint256 indexed requestId, uint256 indexed assetId, string newIpfsHash, address proposer);
    event UpdateApproved(uint256 indexed requestId, address indexed verifier);
    event UpdateExecuted(uint256 indexed requestId, uint256 indexed assetId, string newIpfsHash);
    event AssetValuationUpdated(uint256 indexed assetId, uint256 newValue, address indexed updater);
    event AssetStatusUpdated(uint256 indexed assetId, AssetStatus newStatus, address indexed updater);

    // =============================================================
    //                          STRUCTS (UPDATED)
    // =============================================================

    struct UpdateRequest {
        uint256 requestId;
        uint256 assetId;
        string newIpfsHash;
        uint256 approvalCount;
        bool executed;
        address proposer;
    }

    // =============================================================
    //                          STORAGE (UPDATED)
    // =============================================================

    mapping(uint256 => UpdateRequest) public updateRequests;
    mapping(uint256 => mapping(address => bool)) public hasApprovedUpdate; // requestId => verifier => bool
    uint256 private _nextRequestId = 1;

    // =============================================================
    //                     LIFECYCLE FUNCTIONS
    // =============================================================

    /// @notice Propose an update to asset metadata (IPFS hash).
    /// @dev Only the issuer can propose updates for their asset.
    function proposeAssetUpdate(uint256 assetId, string calldata newIpfsHash) external returns (uint256) {
        AssetDetails storage asset = assets[assetId];
        require(asset.issuer == msg.sender, "AssetRegistry: not issuer");
        require(asset.status == AssetStatus.Approved, "AssetRegistry: asset not active");

        uint256 requestId = _nextRequestId++;
        updateRequests[requestId] = UpdateRequest({
            requestId: requestId,
            assetId: assetId,
            newIpfsHash: newIpfsHash,
            approvalCount: 0,
            executed: false,
            proposer: msg.sender
        });

        emit UpdateProposed(requestId, assetId, newIpfsHash, msg.sender);
        return requestId;
    }

    /// @notice Approve an asset update request (Verifier only).
    function approveAssetUpdate(uint256 requestId) external onlyVerifier {
        UpdateRequest storage request = updateRequests[requestId];
        require(!request.executed, "AssetRegistry: already executed");
        require(!hasApprovedUpdate[requestId][msg.sender], "AssetRegistry: already approved");

        hasApprovedUpdate[requestId][msg.sender] = true;
        request.approvalCount++;

        emit UpdateApproved(requestId, msg.sender);
    }

    /// @notice Execute an approved asset update.
    function executeAssetUpdate(uint256 requestId) external {
        UpdateRequest storage request = updateRequests[requestId];
        require(!request.executed, "AssetRegistry: already executed");
        require(request.approvalCount >= requiredApprovals, "AssetRegistry: insufficient approvals");

        request.executed = true;
        
        AssetDetails storage asset = assets[request.assetId];
        asset.ipfsHash = request.newIpfsHash;

        // Also update the NFT metadata if minted
        if (asset.nftId != 0) {
            assetNFT.setTokenURI(asset.nftId, request.newIpfsHash);
        }

        emit UpdateExecuted(requestId, request.assetId, request.newIpfsHash);
    }

    /// @notice Update the valuation of an asset (Verifier or Admin only).
    function updateAssetValue(uint256 assetId, uint256 newValue) external {
        require(msg.sender == admin || isVerifier[msg.sender], "AssetRegistry: unauthorized");
        
        AssetDetails storage asset = assets[assetId];
        // Value can be updated even if pending or approved
        // But arguably should check if it exists (assetId < _nextAssetId)
        require(asset.assetId == assetId, "AssetRegistry: asset not found");

        asset.value = newValue;
        emit AssetValuationUpdated(assetId, newValue, msg.sender);
    }

    /// @notice Set asset status (e.g., Retire/Delist) (Admin only for now, or verifiers?)
    /// @dev Let's allow Admin or Verifiers to retire assets.
    function setAssetStatus(uint256 assetId, AssetStatus newStatus) external {
        require(msg.sender == admin || isVerifier[msg.sender], "AssetRegistry: unauthorized");
        
        AssetDetails storage asset = assets[assetId];
        require(asset.assetId == assetId, "AssetRegistry: asset not found");
        
        asset.status = newStatus;
        emit AssetStatusUpdated(assetId, newStatus, msg.sender);
    }
    function _addVerifier(address verifier) internal {
        require(verifier != address(0), "AssetRegistry: zero address");
        require(!isVerifier[verifier], "AssetRegistry: already verifier");
        
        isVerifier[verifier] = true;
        verifiers.push(verifier);
        emit VerifierAdded(verifier);
    }
}
