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

    function _addVerifier(address verifier) internal {
        require(verifier != address(0), "AssetRegistry: zero address");
        require(!isVerifier[verifier], "AssetRegistry: already verifier");
        
        isVerifier[verifier] = true;
        verifiers.push(verifier);
        emit VerifierAdded(verifier);
    }
}
