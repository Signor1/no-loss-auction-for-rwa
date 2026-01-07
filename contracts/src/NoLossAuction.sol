// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title NoLossAuction
/// @notice Core auction contract for RWA tokenization with no-loss guarantee.
///         Features:
///           - Time-based auction mechanism
///           - Reserve price protection
///           - Automatic bid validation
///           - Bid refund system (no-loss guarantee)
///           - Auction state management
///           - Emergency pause functionality
///           - Multi-asset auction support
/// @dev This contract implements a no-loss auction where all losing bidders
///      automatically receive refunds, ensuring no financial loss for participants.
contract NoLossAuction {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed assetToken,
        uint256 assetTokenId,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 bidAmount,
        uint256 totalBidAmount
    );

    event BidRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 refundAmount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        bool reserveMet
    );

    event AuctionCancelled(uint256 indexed auctionId, address indexed seller);
    event AuctionPaused(uint256 indexed auctionId, address indexed account);
    event AuctionUnpaused(uint256 indexed auctionId, address indexed account);

    event ReservePriceUpdated(uint256 indexed auctionId, uint256 newReservePrice);
    event EndTimeExtended(uint256 indexed auctionId, uint256 newEndTime);

    // =============================================================
    //                        AUCTION STATES
    // =============================================================

    enum AuctionState {
        Upcoming, // Auction created but not started
        Active, // Auction is live and accepting bids
        Ended, // Auction ended, winner determined
        Cancelled // Auction cancelled by seller
    }

    // =============================================================
    //                        BID STRUCT
    // =============================================================

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }

    // =============================================================
    //                        AUCTION STRUCT
    // =============================================================

    struct Auction {
        uint256 auctionId;
        address seller;
        address assetToken; // ERC-20, ERC-721, or ERC-1155 token address
        uint256 assetTokenId; // For ERC-721/ERC-1155, 0 for ERC-20
        uint256 assetAmount; // Amount for ERC-20/ERC-1155, 1 for ERC-721
        uint256 reservePrice; // Minimum acceptable bid
        uint256 startTime;
        uint256 endTime;
        uint256 minBidIncrement; // Minimum increase over current highest bid
        AuctionState state;
        bool paused;
        address paymentToken; // Address(0) for native ETH, or ERC-20 token
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    // Mapping from auction ID to auction data
    mapping(uint256 => Auction) public auctions;

    // Mapping from auction ID to array of bids
    mapping(uint256 => Bid[]) public bids;

    // Mapping from auction ID to bidder address to bid index
    mapping(uint256 => mapping(address => uint256)) public bidderBidIndex;

    // Mapping from auction ID to highest bid amount
    mapping(uint256 => uint256) public highestBid;

    // Mapping from auction ID to highest bidder
    mapping(uint256 => address) public highestBidder;

    // Mapping from auction ID to total bid amount (sum of all bids)
    mapping(uint256 => uint256) public totalBidAmount;

    // Mapping from auction ID to bidder to total bid amount
    mapping(uint256 => mapping(address => uint256)) public bidderTotalBid;

    // Escrow: mapping from auction ID to bidder to escrowed amount
    mapping(uint256 => mapping(address => uint256)) public escrow;

    // Next auction ID
    uint256 private _nextAuctionId;

    // Access control
    address public owner;
    address public auctionManager;

    modifier onlyOwner() {
        require(msg.sender == owner, "NoLossAuction: caller is not owner");
        _;
    }

    modifier onlyOwnerOrManager() {
        require(msg.sender == owner || msg.sender == auctionManager, "NoLossAuction: not authorized");
        _;
    }

    modifier onlySeller(uint256 auctionId) {
        require(auctions[auctionId].seller == msg.sender, "NoLossAuction: not seller");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(address initialOwner) {
        require(initialOwner != address(0), "NoLossAuction: owner is zero");
        owner = initialOwner;
        auctionManager = initialOwner;
    }

    // =============================================================
    //                    AUCTION CREATION
    // =============================================================

    /// @notice Create a new auction.
    /// @param assetToken Address of the asset token (ERC-20, ERC-721, or ERC-1155)
    /// @param assetTokenId Token ID for ERC-721/ERC-1155 (0 for ERC-20)
    /// @param assetAmount Amount for ERC-20/ERC-1155 (1 for ERC-721)
    /// @param reservePrice Minimum acceptable bid price
    /// @param startTime Auction start timestamp
    /// @param endTime Auction end timestamp
    /// @param minBidIncrement Minimum bid increment over current highest bid
    /// @param paymentToken Payment token address (address(0) for native ETH)
    /// @return auctionId The ID of the created auction
    function createAuction(
        address assetToken,
        uint256 assetTokenId,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime,
        uint256 minBidIncrement,
        address paymentToken
    ) external returns (uint256 auctionId) {
        require(assetToken != address(0), "NoLossAuction: asset token is zero");
        require(assetAmount > 0, "NoLossAuction: asset amount is zero");
        require(reservePrice > 0, "NoLossAuction: reserve price is zero");
        require(startTime >= block.timestamp, "NoLossAuction: invalid start time");
        require(endTime > startTime, "NoLossAuction: invalid end time");
        require(minBidIncrement > 0, "NoLossAuction: min bid increment is zero");

        auctionId = _nextAuctionId++;
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            seller: msg.sender,
            assetToken: assetToken,
            assetTokenId: assetTokenId,
            assetAmount: assetAmount,
            reservePrice: reservePrice,
            startTime: startTime,
            endTime: endTime,
            minBidIncrement: minBidIncrement,
            state: startTime > block.timestamp ? AuctionState.Upcoming : AuctionState.Active,
            paused: false,
            paymentToken: paymentToken
        });

        // Transfer asset from seller to this contract (escrow)
        _transferAssetFrom(msg.sender, address(this), assetToken, assetTokenId, assetAmount);

        emit AuctionCreated(
            auctionId,
            msg.sender,
            assetToken,
            assetTokenId,
            assetAmount,
            reservePrice,
            startTime,
            endTime
        );

        return auctionId;
    }

    // =============================================================
    //                    BIDDING MECHANISM
    // =============================================================

    /// @notice Place a bid on an active auction.
    /// @param auctionId The auction ID
    /// @param bidAmount The bid amount
    function placeBid(uint256 auctionId, uint256 bidAmount) external payable {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(!auction.paused, "NoLossAuction: auction is paused");
        require(auction.state == AuctionState.Active, "NoLossAuction: auction not active");
        require(block.timestamp >= auction.startTime, "NoLossAuction: auction not started");
        require(block.timestamp < auction.endTime, "NoLossAuction: auction ended");
        require(bidAmount > 0, "NoLossAuction: bid amount is zero");

        // Validate payment
        if (auction.paymentToken == address(0)) {
            require(msg.value == bidAmount, "NoLossAuction: incorrect ETH amount");
        } else {
            require(msg.value == 0, "NoLossAuction: ETH not accepted");
        }

        // Automatic bid validation
        uint256 currentHighest = highestBid[auctionId];
        uint256 newTotalBid = bidderTotalBid[auctionId][msg.sender] + bidAmount;

        if (currentHighest > 0) {
            require(
                newTotalBid >= currentHighest + auction.minBidIncrement,
                "NoLossAuction: bid below minimum increment"
            );
        } else {
            require(newTotalBid >= auction.reservePrice, "NoLossAuction: bid below reserve price");
        }

        // Transfer payment to escrow
        if (auction.paymentToken == address(0)) {
            // Native ETH already received via msg.value
            escrow[auctionId][msg.sender] += bidAmount;
        } else {
            _transferPaymentTokenFrom(msg.sender, address(this), auction.paymentToken, bidAmount);
            escrow[auctionId][msg.sender] += bidAmount;
        }

        // Update bid tracking
        uint256 bidIndex = bids[auctionId].length;
        bids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: bidAmount,
            timestamp: block.timestamp,
            refunded: false
        }));

        if (bidderBidIndex[auctionId][msg.sender] == 0) {
            bidderBidIndex[auctionId][msg.sender] = bidIndex + 1; // 1-indexed
        }

        bidderTotalBid[auctionId][msg.sender] = newTotalBid;
        totalBidAmount[auctionId] += bidAmount;

        // Update highest bid if this is the new highest
        if (newTotalBid > currentHighest) {
            highestBid[auctionId] = newTotalBid;
            highestBidder[auctionId] = msg.sender;
        }

        emit BidPlaced(auctionId, msg.sender, bidAmount, newTotalBid);
    }

    // =============================================================
    //                    BID REFUND SYSTEM (NO-LOSS)
    // =============================================================

    /// @notice Refund all losing bidders after auction ends.
    /// @param auctionId The auction ID
    function refundLosingBidders(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.state == AuctionState.Ended, "NoLossAuction: auction not ended");
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");

        address winner = highestBidder[auctionId];
        uint256 winningBid = highestBid[auctionId];

        // Refund all bidders except the winner
        Bid[] storage auctionBids = bids[auctionId];
        for (uint256 i = 0; i < auctionBids.length; i++) {
            Bid storage bid = auctionBids[i];
            if (bid.bidder != winner && !bid.refunded && escrow[auctionId][bid.bidder] > 0) {
                uint256 refundAmount = escrow[auctionId][bid.bidder];
                escrow[auctionId][bid.bidder] = 0;
                bid.refunded = true;

                // Transfer refund
                if (auction.paymentToken == address(0)) {
                    (bool success,) = payable(bid.bidder).call{value: refundAmount}("");
                    require(success, "NoLossAuction: refund transfer failed");
                } else {
                    _transferPaymentToken(bid.bidder, auction.paymentToken, refundAmount);
                }

                emit BidRefunded(auctionId, bid.bidder, refundAmount);
            }
        }
    }

    /// @notice Refund a specific bidder (can be called by anyone after auction ends).
    /// @param auctionId The auction ID
    /// @param bidder The bidder to refund
    function refundBidder(uint256 auctionId, address bidder) external {
        Auction storage auction = auctions[auctionId];
        require(auction.state == AuctionState.Ended, "NoLossAuction: auction not ended");
        require(bidder != highestBidder[auctionId], "NoLossAuction: cannot refund winner");
        require(escrow[auctionId][bidder] > 0, "NoLossAuction: no funds to refund");

        uint256 refundAmount = escrow[auctionId][bidder];
        escrow[auctionId][bidder] = 0;

        // Mark all bids from this bidder as refunded
        Bid[] storage auctionBids = bids[auctionId];
        for (uint256 i = 0; i < auctionBids.length; i++) {
            if (auctionBids[i].bidder == bidder) {
                auctionBids[i].refunded = true;
            }
        }

        // Transfer refund
        if (auction.paymentToken == address(0)) {
            (bool success,) = payable(bidder).call{value: refundAmount}("");
            require(success, "NoLossAuction: refund transfer failed");
        } else {
            _transferPaymentToken(bidder, auction.paymentToken, refundAmount);
        }

        emit BidRefunded(auctionId, bidder, refundAmount);
    }

    // =============================================================
    //                    AUCTION ENDING & SETTLEMENT
    // =============================================================

    /// @notice End the auction and determine the winner.
    /// @param auctionId The auction ID
    function endAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(auction.state == AuctionState.Active, "NoLossAuction: auction not active");
        require(block.timestamp >= auction.endTime, "NoLossAuction: auction not ended");

        address winner = highestBidder[auctionId];
        uint256 winningBid = highestBid[auctionId];
        bool reserveMet = winningBid >= auction.reservePrice;

        if (reserveMet && winner != address(0)) {
            // Transfer asset to winner
            _transferAsset(
                winner,
                auction.assetToken,
                auction.assetTokenId,
                auction.assetAmount
            );

            // Transfer payment to seller from winner's escrow
            uint256 paymentAmount = escrow[auctionId][winner];
            if (paymentAmount > 0) {
                if (auction.paymentToken == address(0)) {
                    (bool success,) = payable(auction.seller).call{value: paymentAmount}("");
                    require(success, "NoLossAuction: payment transfer failed");
                } else {
                    _transferPaymentToken(auction.seller, auction.paymentToken, paymentAmount);
                }
                escrow[auctionId][winner] = 0;
            }
        } else {
            // Reserve not met or no bids - return asset to seller
            _transferAsset(
                auction.seller,
                auction.assetToken,
                auction.assetTokenId,
                auction.assetAmount
            );
        }

        auction.state = AuctionState.Ended;

        emit AuctionEnded(auctionId, winner, winningBid, reserveMet);
    }

    // =============================================================
    //                    AUCTION STATE MANAGEMENT
    // =============================================================

    /// @notice Cancel an auction (only seller or owner).
    /// @param auctionId The auction ID
    function cancelAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(
            msg.sender == auction.seller || msg.sender == owner,
            "NoLossAuction: not authorized"
        );
        require(
            auction.state == AuctionState.Upcoming || auction.state == AuctionState.Active,
            "NoLossAuction: cannot cancel"
        );

        // Return asset to seller
        _transferAsset(
            auction.seller,
            auction.assetToken,
            auction.assetTokenId,
            auction.assetAmount
        );

        // Refund all bidders
        Bid[] storage auctionBids = bids[auctionId];
        for (uint256 i = 0; i < auctionBids.length; i++) {
            address bidder = auctionBids[i].bidder;
            if (escrow[auctionId][bidder] > 0) {
                uint256 refundAmount = escrow[auctionId][bidder];
                escrow[auctionId][bidder] = 0;

                if (auction.paymentToken == address(0)) {
                    (bool success,) = payable(bidder).call{value: refundAmount}("");
                    require(success, "NoLossAuction: refund transfer failed");
                } else {
                    _transferPaymentToken(bidder, auction.paymentToken, refundAmount);
                }

                emit BidRefunded(auctionId, bidder, refundAmount);
            }
        }

        auction.state = AuctionState.Cancelled;

        emit AuctionCancelled(auctionId, auction.seller);
    }

    /// @notice Pause an auction (emergency functionality).
    /// @param auctionId The auction ID
    function pauseAuction(uint256 auctionId) external onlyOwnerOrManager {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(!auction.paused, "NoLossAuction: already paused");
        require(
            auction.state == AuctionState.Active,
            "NoLossAuction: can only pause active auctions"
        );

        auction.paused = true;
        emit AuctionPaused(auctionId, msg.sender);
    }

    /// @notice Unpause an auction.
    /// @param auctionId The auction ID
    function unpauseAuction(uint256 auctionId) external onlyOwnerOrManager {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(auction.paused, "NoLossAuction: not paused");

        auction.paused = false;
        emit AuctionUnpaused(auctionId, msg.sender);
    }

    // =============================================================
    //                    AUCTION CONFIGURATION
    // =============================================================

    /// @notice Update reserve price (only before auction starts).
    /// @param auctionId The auction ID
    /// @param newReservePrice New reserve price
    function updateReservePrice(uint256 auctionId, uint256 newReservePrice)
        external
        onlySeller(auctionId)
    {
        Auction storage auction = auctions[auctionId];
        require(auction.state == AuctionState.Upcoming, "NoLossAuction: auction already started");
        require(newReservePrice > 0, "NoLossAuction: reserve price is zero");

        auction.reservePrice = newReservePrice;
        emit ReservePriceUpdated(auctionId, newReservePrice);
    }

    /// @notice Extend auction end time (only seller or owner).
    /// @param auctionId The auction ID
    /// @param newEndTime New end time
    function extendEndTime(uint256 auctionId, uint256 newEndTime) external {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(
            msg.sender == auction.seller || msg.sender == owner,
            "NoLossAuction: not authorized"
        );
        require(auction.state == AuctionState.Active, "NoLossAuction: auction not active");
        require(newEndTime > block.timestamp, "NoLossAuction: invalid end time");
        require(newEndTime > auction.endTime, "NoLossAuction: cannot shorten end time");

        auction.endTime = newEndTime;
        emit EndTimeExtended(auctionId, newEndTime);
    }

    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================

    /// @notice Get auction details.
    /// @param auctionId The auction ID
    /// @return auction Auction struct
    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    /// @notice Get number of bids for an auction.
    /// @param auctionId The auction ID
    /// @return count Number of bids
    function getBidCount(uint256 auctionId) external view returns (uint256) {
        return bids[auctionId].length;
    }

    /// @notice Get bid at index.
    /// @param auctionId The auction ID
    /// @param index Bid index
    /// @return bid Bid struct
    function getBid(uint256 auctionId, uint256 index) external view returns (Bid memory) {
        return bids[auctionId][index];
    }

    /// @notice Get all bids for an auction.
    /// @param auctionId The auction ID
    /// @return auctionBids Array of bids
    function getAllBids(uint256 auctionId) external view returns (Bid[] memory) {
        return bids[auctionId];
    }

    /// @notice Check if auction is active and accepting bids.
    /// @param auctionId The auction ID
    /// @return active Whether auction is active
    function isAuctionActive(uint256 auctionId) external view returns (bool) {
        Auction memory auction = auctions[auctionId];
        // Check if state should be Active (Upcoming transitions to Active when startTime passes)
        bool stateIsActive = auction.state == AuctionState.Active ||
            (auction.state == AuctionState.Upcoming && block.timestamp >= auction.startTime);
        return
            stateIsActive &&
            !auction.paused &&
            block.timestamp >= auction.startTime &&
            block.timestamp < auction.endTime;
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    function setAuctionManager(address newManager) external onlyOwner {
        require(newManager != address(0), "NoLossAuction: manager is zero");
        auctionManager = newManager;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NoLossAuction: new owner is zero");
        owner = newOwner;
    }

    // =============================================================
    //                    INTERNAL HELPERS
    // =============================================================

    /// @dev Transfer asset from one address to another (supports ERC-20, ERC-721, ERC-1155).
    function _transferAssetFrom(
        address from,
        address to,
        address assetToken,
        uint256 tokenId,
        uint256 amount
    ) private {
        // Try ERC-20 first (tokenId = 0, amount > 0)
        if (tokenId == 0 && amount > 0) {
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "NoLossAuction: ERC-20 transfer failed");
            return;
        }

        // Try ERC-721 (amount = 1)
        if (amount == 1) {
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, tokenId)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "NoLossAuction: ERC-721 transfer failed");
            return;
        }

        // Try ERC-1155 (amount > 1, tokenId > 0)
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
        require(success, "NoLossAuction: ERC-1155 transfer failed");
    }

    /// @dev Transfer asset to an address (from this contract).
    function _transferAsset(address to, address assetToken, uint256 tokenId, uint256 amount)
        private
    {
        // Try ERC-20 first (tokenId = 0, amount > 0)
        if (tokenId == 0 && amount > 0) {
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("transfer(address,uint256)", to, amount)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "NoLossAuction: ERC-20 transfer failed");
            return;
        }

        // Try ERC-721 (amount = 1)
        if (amount == 1) {
            (bool success, bytes memory data) = assetToken.call(
                abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), to, tokenId)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "NoLossAuction: ERC-721 transfer failed");
            return;
        }

        // Try ERC-1155 (amount > 1, tokenId > 0)
        (bool success, bytes memory data) = assetToken.call(
            abi.encodeWithSignature(
                "safeTransferFrom(address,address,uint256,uint256,bytes)",
                address(this),
                to,
                tokenId,
                amount,
                ""
            )
        );
        require(success, "NoLossAuction: ERC-1155 transfer failed");
    }

    /// @dev Transfer payment token from one address to another.
    function _transferPaymentTokenFrom(address from, address to, address token, uint256 amount)
        private
    {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "NoLossAuction: payment transfer failed");
    }

    /// @dev Transfer payment token to an address.
    function _transferPaymentToken(address to, address token, uint256 amount) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "NoLossAuction: payment transfer failed");
    }

    // Receive ETH
    receive() external payable {}
}

