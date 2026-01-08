// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./NoLossAuction.sol";
import "./lib/ReentrancyGuard.sol";

/// @title AuctionFactory
/// @notice Factory contract to create auctions on NoLossAuction with templates and fees.
/// @dev Implements Feature 2.4: Auction Factory
contract AuctionFactory is ReentrancyGuard {
    // =============================================================
    //                           STRUCTS
    // =============================================================

    struct AuctionTemplate {
        string name;
        uint256 minBidIncrement;
        uint256 bidExpirationPeriod;
        uint256 withdrawalPenaltyBps;
        bool autoSettleEnabled;
        uint256 withdrawalLockPeriod;
        bool secureEscrowEnabled;
        bool active;
    }

    // =============================================================
    //                           STORAGE
    // =============================================================

    NoLossAuction public immutable noLossAuction;
    address public owner;
    address public feeReceiver;
    uint256 public creationFee;
    bool private _paused;

    // Template storage
    mapping(uint256 => AuctionTemplate) public templates;
    uint256 public nextTemplateId;

    // Registry
    uint256[] public createdAuctions;
    mapping(uint256 => bool) public isCreatedByFactory;
    mapping(address => uint256[]) public auctionsByCreator;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event TemplateCreated(uint256 indexed templateId, string name);
    event TemplateUpdated(uint256 indexed templateId, bool active);
    event AuctionCreatedFromFactory(
        uint256 indexed auctionId,
        uint256 indexed templateId,
        address indexed creator,
        address assetToken,
        uint256 assetId,
        uint256 amount
    );
    event FeeUpdated(uint256 newFee);
    event FeeReceiverUpdated(address newReceiver);
    event FeesCollected(address indexed receiver, uint256 amount);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    // =============================================================
    //                          MODIFIERS
    // =============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "AuctionFactory: not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "AuctionFactory: paused");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(address _noLossAuction, address _feeReceiver, uint256 _creationFee) {
        require(_noLossAuction != address(0), "AuctionFactory: invalid auction contract");
        require(_feeReceiver != address(0), "AuctionFactory: invalid fee receiver");
        
        noLossAuction = NoLossAuction(payable(_noLossAuction));
        owner = msg.sender;
        feeReceiver = _feeReceiver;
        creationFee = _creationFee;
        
        // Initialize with a default template
        _addTemplate(
            "Standard Auction",
            0.01 ether, // minBidIncrement (assuming payment token decimals or ETH)
            0,          // bidExpirationPeriod (0 = none)
            0,          // withdrawalPenaltyBps
            true,       // autoSettleEnabled
            0,          // withdrawalLockPeriod
            false       // secureEscrowEnabled
        );
    }

    // =============================================================
    //                    TEMPLATE MANAGEMENT
    // =============================================================

    function addTemplate(
        string memory name,
        uint256 minBidIncrement,
        uint256 bidExpirationPeriod,
        uint256 withdrawalPenaltyBps,
        bool autoSettleEnabled,
        uint256 withdrawalLockPeriod,
        bool secureEscrowEnabled
    ) external onlyOwner returns (uint256) {
        return _addTemplate(
            name,
            minBidIncrement,
            bidExpirationPeriod,
            withdrawalPenaltyBps,
            autoSettleEnabled,
            withdrawalLockPeriod,
            secureEscrowEnabled
        );
    }

    function _addTemplate(
        string memory name,
        uint256 minBidIncrement,
        uint256 bidExpirationPeriod,
        uint256 withdrawalPenaltyBps,
        bool autoSettleEnabled,
        uint256 withdrawalLockPeriod,
        bool secureEscrowEnabled
    ) internal returns (uint256) {
        uint256 templateId = nextTemplateId++;
        templates[templateId] = AuctionTemplate({
            name: name,
            minBidIncrement: minBidIncrement,
            bidExpirationPeriod: bidExpirationPeriod,
            withdrawalPenaltyBps: withdrawalPenaltyBps,
            autoSettleEnabled: autoSettleEnabled,
            withdrawalLockPeriod: withdrawalLockPeriod,
            secureEscrowEnabled: secureEscrowEnabled,
            active: true
        });

        emit TemplateCreated(templateId, name);
        return templateId;
    }

    function toggleTemplate(uint256 templateId) external onlyOwner {
        require(bytes(templates[templateId].name).length > 0, "AuctionFactory: template does not exist");
        templates[templateId].active = !templates[templateId].active;
        emit TemplateUpdated(templateId, templates[templateId].active);
    }

    // =============================================================
    //                    AUCTION CREATION
    // =============================================================

    function createAuction(
        uint256 templateId,
        address assetToken,
        uint256 assetTokenId,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime,
        address paymentToken
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        // Fee collection
        require(msg.value >= creationFee, "AuctionFactory: insufficient fee");
        
        // Create auction using template
        AuctionTemplate memory tmpl = templates[templateId];
        require(tmpl.active, "AuctionFactory: template inactive");
        
        // Validation handled by NoLossAuction, but we can add pre-checks here
        require(assetToken != address(0), "AuctionFactory: invalid asset");

        // We need to transfer Asset from User -> Factory -> NoLossAuction
        // User must approve Factory to spend Asset
        _transferAssetFrom(msg.sender, address(this), assetToken, assetTokenId, assetAmount);
        
        // Approve NoLossAuction to spend Asset from Factory
        _approveAsset(address(noLossAuction), assetToken, assetTokenId, assetAmount);

        // Call NoLossAuction.createAuction
        uint256 auctionId = noLossAuction.createAuction(
            assetToken,
            assetTokenId,
            assetAmount,
            reservePrice,
            startTime,
            endTime,
            tmpl.minBidIncrement,
            paymentToken,
            tmpl.bidExpirationPeriod,
            tmpl.withdrawalPenaltyBps,
            tmpl.autoSettleEnabled,
            tmpl.withdrawalLockPeriod,
            tmpl.secureEscrowEnabled
        );

        // Registry updates
        createdAuctions.push(auctionId);
        isCreatedByFactory[auctionId] = true;
        auctionsByCreator[msg.sender].push(auctionId);

        // Refund excess fee if any
        if (msg.value > creationFee) {
            (bool refundSuccess,) = payable(msg.sender).call{value: msg.value - creationFee}("");
            require(refundSuccess, "AuctionFactory: refund failed");
        }

        // Send fee to receiver
        if (creationFee > 0) {
            (bool feeSuccess,) = payable(feeReceiver).call{value: creationFee}("");
            require(feeSuccess, "AuctionFactory: fee transfer failed");
            emit FeesCollected(feeReceiver, creationFee);
        }

        emit AuctionCreatedFromFactory(
            auctionId,
            templateId,
            msg.sender,
            assetToken,
            assetTokenId,
            assetAmount
        );

        return auctionId;
    }

    // =============================================================
    //                    ADMIN & UTILS
    // =============================================================

    function setCreationFee(uint256 _creationFee) external onlyOwner {
        creationFee = _creationFee;
        emit FeeUpdated(_creationFee);
    }

    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "AuctionFactory: invalid receiver");
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    function getCreatedAuctionsCount() external view returns (uint256) {
        return createdAuctions.length;
    }

    function getAuctionsByCreator(address creator) external view returns (uint256[] memory) {
        return auctionsByCreator[creator];
    }

    function pause() external onlyOwner {
        require(!_paused, "AuctionFactory: already paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        require(_paused, "AuctionFactory: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }

    function paused() external view returns (bool) {
        return _paused;
    }

    // =============================================================
    //                    INTERNAL ASSET HELPERS
    // =============================================================

    function _transferAssetFrom(
        address from,
        address to,
        address assetToken,
        uint256 tokenId,
        uint256 amount
    ) internal {
        // Logic similar to NoLossAuction but handling transfer into this contract
        if (tokenId == 0 && amount > 0) {
            // ERC-20
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "AuctionFactory: ERC-20 transfer failed");
        } else if (amount == 1) {
            // ERC-721
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, tokenId)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "AuctionFactory: ERC-721 transfer failed");
        } else {
            // ERC-1155
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature(
                    "safeTransferFrom(address,address,uint256,uint256,bytes)",
                    from,
                    to,
                    tokenId,
                    amount,
                    ""
                )
            );
            require(success, "AuctionFactory: ERC-1155 transfer failed");
        }
    }

    function _approveAsset(
        address spender,
        address assetToken,
        uint256 tokenId,
        uint256 amount
    ) internal {
        if (tokenId == 0 && amount > 0) {
            // ERC-20
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("approve(address,uint256)", spender, amount)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "AuctionFactory: ERC-20 approve failed");
        } else if (amount == 1) {
             // ERC-721
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("approve(address,uint256)", spender, tokenId)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "AuctionFactory: ERC-721 approve failed");
        } else {
            // ERC-1155
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("setApprovalForAll(address,bool)", spender, true)
            );
            require(success, "AuctionFactory: ERC-1155 approve failed");
        }
    }
}
