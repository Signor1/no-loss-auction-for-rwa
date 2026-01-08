// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./AssetRegistry.sol";
import "./RWAAssetNFT.sol";
import "./RWAFractionalToken.sol";
import "./DividendDistributor.sol";
import "./lib/IERC721Receiver.sol";
import "./lib/ReentrancyGuard.sol";

/// @title TokenizationEngine
/// @notice Handles the fractionalization of RWAs, custody of NFTs, and deployment of fractional tokens.
contract TokenizationEngine is IERC721Receiver, ReentrancyGuard {
    
    // =============================================================
    //                           EVENTS
    // =============================================================

    event AssetFractionalized(
        uint256 indexed assetId, 
        address indexed fractionalToken, 
        address indexed distributor,
        uint256 supply, 
        uint256 valuation
    );
    event AssetUnfractionalized(uint256 indexed assetId, address indexed redeemer);

    // =============================================================
    //                          STRUCTS
    // =============================================================

    struct TokenizedAsset {
        address fractionalToken;
        address distributor;
        bool active;
        uint256 initialSupply;
        uint256 valuation;
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    AssetRegistry public immutable assetRegistry;
    RWAAssetNFT public immutable assetNFT;

    // Mapping from assetId => TokenizedAsset
    mapping(uint256 => TokenizedAsset) public tokenizedAssets;

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(address _assetRegistry, address _assetNFT) {
        require(_assetRegistry != address(0), "TokenizationEngine: registry is zero");
        require(_assetNFT != address(0), "TokenizationEngine: nft is zero");
        
        assetRegistry = AssetRegistry(_assetRegistry);
        assetNFT = RWAAssetNFT(_assetNFT);
    }

    // =============================================================
    //                     FRACTIONALIZATION
    // =============================================================

    /// @notice Fractionalize an approved asset.
    /// @dev Caller must own the NFT and approve this contract.
    /// @param assetId ID of the asset to fractionalize
    /// @param name Name for the fractional token
    /// @param symbol Symbol for the fractional token
    /// @param supply Total supply of fractional tokens
    /// @param price Valuation of the asset (for record keeping)
    function fractionalize(
        uint256 assetId,
        string calldata name,
        string calldata symbol,
        uint256 supply,
        uint256 price
    ) external nonReentrant returns (address tokenAddress, address distributorAddress) {
        // 1. Verify Asset Status
        (,,, uint256 value, AssetRegistry.AssetStatus status,, uint256 nftId) = assetRegistry.assets(assetId);
        require(status == AssetRegistry.AssetStatus.Approved, "TokenizationEngine: asset not approved");
        require(assetId == nftId, "TokenizationEngine: id mismatch"); // Assuming simple mapping 
        
        // 2. Transfer NFT to Custody
        // We use the same ID logic as AssetRegistry (nftId == assetId)
        require(assetNFT.ownerOf(assetId) == msg.sender, "TokenizationEngine: not owner");
        assetNFT.safeTransferFrom(msg.sender, address(this), assetId);

        // 3. Deploy Fractional Token
        // We set THIS contract as the initial owner so we can configure it,
        // then we might transfer ownership or keep it to manage snapshots.
        // For DividendDistribution, the distributor needs to snapshot.
        // So we will keep ownership or grant roles.
        RWAFractionalToken token = new RWAFractionalToken(
            name,
            symbol,
            18,
            address(this), // Initial owner is Engine
            supply,
            true // Enable restrictions by default
        );
        tokenAddress = address(token);

        // 4. Deploy Distributor
        DividendDistributor distributor = new DividendDistributor(tokenAddress, address(this));
        distributorAddress = address(distributor);

        // 5. Configure Roles
        // Grant Distributor the ability to snapshot (via compliance admin role if needed, 
        // OR allow it explicitly if we modified token. 
        // Since RWAFractionalToken uses `onlyOwnerOrCompliance`, we can set Distributor as ComplianceAdmin.
        token.setComplianceAdmin(distributorAddress);

        // 5b. Whitelist needed parties for initial transfer
        token.setWhitelist(address(this), true);
        token.setWhitelist(msg.sender, true);

        // 6. Transfer Tokens to Issuer
        token.transfer(msg.sender, supply);

        // 7. Transfer Ownership to Issuer
        token.transferOwnership(msg.sender);

        // 8. Record State
        tokenizedAssets[assetId] = TokenizedAsset({
            fractionalToken: tokenAddress,
            distributor: distributorAddress,
            active: true,
            initialSupply: supply,
            valuation: price > 0 ? price : value
        });

        emit AssetFractionalized(assetId, tokenAddress, distributorAddress, supply, price);
    }

    // =============================================================
    //                    UN-FRACTIONALIZATION
    // =============================================================

    /// @notice Redeem 100% of tokens to retrieve the underlying NFT.
    /// @param assetId ID of the asset to redeem
    function unfractionalize(uint256 assetId) external nonReentrant {
        TokenizedAsset storage tAsset = tokenizedAssets[assetId];
        require(tAsset.active, "TokenizationEngine: not active");
        
        RWAFractionalToken token = RWAFractionalToken(tAsset.fractionalToken);
        
        // Check balance
        uint256 callerBalance = token.balanceOf(msg.sender);
        uint256 totalSupply = token.totalSupply();
        require(callerBalance == totalSupply, "TokenizationEngine: must hold 100%");

        // Burn tokens
        // We need allowance to burnFrom, or we transfer to self and burn?
        // Since we are not the token itself, we need allowance or transfer.
        // Easier: User approves Engine, Engine burns.
        token.transferFrom(msg.sender, address(this), callerBalance);
        token.burn(callerBalance);

        // Return NFT
        assetNFT.safeTransferFrom(address(this), msg.sender, assetId);

        // Mark inactive
        tAsset.active = false;

        emit AssetUnfractionalized(assetId, msg.sender);
    }

    // =============================================================
    //                     IERC721Receiver
    // =============================================================

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
