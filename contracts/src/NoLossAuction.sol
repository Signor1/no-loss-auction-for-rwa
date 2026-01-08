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

    event BidWithdrawn(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 withdrawnAmount,
        uint256 penaltyAmount
    );

    event BidExpired(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 expiredBidAmount
    );

    event AutomaticSettlementExecuted(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event EscrowDeposited(
        uint256 indexed auctionId,
        address indexed bidder,
        address indexed paymentToken,
        uint256 amount
    );

    event EscrowWithdrawn(
        uint256 indexed auctionId,
        address indexed bidder,
        address indexed paymentToken,
        uint256 amount,
        uint256 unlockTime
    );

    event EscrowUnlocked(
        uint256 indexed auctionId,
        address indexed bidder,
        address indexed paymentToken,
        uint256 amount
    );

    event EscrowRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        address indexed paymentToken,
        uint256 amount,
        string reason
    );

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
        uint256 expirationTime; // When this bid expires (0 = no expiration)
        bool refunded;
        bool withdrawn;
        bool expired;
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
        uint256 bidExpirationPeriod; // How long bids remain valid (0 = no expiration)
        uint256 withdrawalPenaltyBps; // Penalty for early withdrawal in basis points (0 = no penalty)
        bool autoSettleEnabled; // Whether to automatically settle when auction ends
        uint256 withdrawalLockPeriod; // Time lock period for withdrawals (0 = no lock)
        bool secureEscrowEnabled; // Enhanced security features for escrow
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

    // Escrow details for time-locked withdrawals
    struct EscrowLock {
        uint256 amount;
        uint256 unlockTime; // Timestamp when funds can be withdrawn
        bool locked; // Whether withdrawal is time-locked
        address paymentToken; // Payment token address
    }

    // Mapping from auction ID to bidder to escrow lock details
    mapping(uint256 => mapping(address => EscrowLock)) public escrowLocks;

    // Total escrowed amount per auction (for security tracking)
    mapping(uint256 => uint256) public totalEscrowed;

    // Total escrowed amount per payment token (for multi-currency tracking)
    mapping(address => uint256) public totalEscrowedByToken;

    // Withdrawal lock period (in seconds) - can be set per auction
    mapping(uint256 => uint256) public withdrawalLockPeriod;

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
    /// @param bidExpirationPeriod How long bids remain valid in seconds (0 = no expiration)
    /// @param withdrawalPenaltyBps Penalty for early withdrawal in basis points (0 = no penalty)
    /// @param autoSettleEnabled Whether to automatically settle when auction ends
    /// @param _withdrawalLockPeriod Time lock period for withdrawals in seconds (0 = no lock)
    /// @param secureEscrowEnabled Enable enhanced security features for escrow
    /// @return auctionId The ID of the created auction
    function createAuction(
        address assetToken,
        uint256 assetTokenId,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime,
        uint256 minBidIncrement,
        address paymentToken,
        uint256 bidExpirationPeriod,
        uint256 withdrawalPenaltyBps,
        bool autoSettleEnabled,
        uint256 _withdrawalLockPeriod,
        bool secureEscrowEnabled
    ) external returns (uint256 auctionId) {
        require(assetToken != address(0), "NoLossAuction: asset token is zero");
        require(assetAmount > 0, "NoLossAuction: asset amount is zero");
        require(reservePrice > 0, "NoLossAuction: reserve price is zero");
        require(startTime >= block.timestamp, "NoLossAuction: invalid start time");
        require(endTime > startTime, "NoLossAuction: invalid end time");
        require(minBidIncrement > 0, "NoLossAuction: min bid increment is zero");
        require(withdrawalPenaltyBps <= 10_000, "NoLossAuction: penalty exceeds 100%");

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
            bidExpirationPeriod: bidExpirationPeriod,
            withdrawalPenaltyBps: withdrawalPenaltyBps,
            autoSettleEnabled: autoSettleEnabled,
            withdrawalLockPeriod: _withdrawalLockPeriod,
            secureEscrowEnabled: secureEscrowEnabled,
            state: startTime > block.timestamp ? AuctionState.Upcoming : AuctionState.Active,
            paused: false,
            paymentToken: paymentToken
        });

        // Set withdrawal lock period for this auction
        withdrawalLockPeriod[auctionId] = _withdrawalLockPeriod;

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

        // Transfer payment to escrow with enhanced tracking
        _depositToEscrow(auctionId, msg.sender, auction.paymentToken, bidAmount);

        // Check and handle expired bids before placing new bid
        _checkAndHandleExpiredBids(auctionId);

        // Calculate bid expiration time
        uint256 expirationTime = 0;
        if (auction.bidExpirationPeriod > 0) {
            expirationTime = block.timestamp + auction.bidExpirationPeriod;
        }

        // Update bid tracking
        uint256 bidIndex = bids[auctionId].length;
        bids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: bidAmount,
            timestamp: block.timestamp,
            expirationTime: expirationTime,
            refunded: false,
            withdrawn: false,
            expired: false
        }));

        if (bidderBidIndex[auctionId][msg.sender] == 0) {
            bidderBidIndex[auctionId][msg.sender] = bidIndex + 1; // 1-indexed
        }

        bidderTotalBid[auctionId][msg.sender] = newTotalBid;
        totalBidAmount[auctionId] += bidAmount;

        // Update highest bid if this is the new highest
        // Need to recalculate after handling expired bids
        uint256 effectiveHighest = _getEffectiveHighestBid(auctionId);
        // Update if new bid is higher, or if sender is already highest bidder (they increased their bid)
        if (newTotalBid > effectiveHighest || highestBidder[auctionId] == msg.sender) {
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
                bid.refunded = true;
                _refundFromEscrow(auctionId, bid.bidder, "Losing bidder refund");
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

        // Mark all bids from this bidder as refunded
        Bid[] storage auctionBids = bids[auctionId];
        for (uint256 i = 0; i < auctionBids.length; i++) {
            if (auctionBids[i].bidder == bidder) {
                auctionBids[i].refunded = true;
            }
        }

        _refundFromEscrow(auctionId, bidder, "Individual bidder refund");
        emit BidRefunded(auctionId, bidder, refundAmount);
    }

    // =============================================================
    //                    BID WITHDRAWAL WITH PENALTIES
    // =============================================================

    /// @notice Withdraw a bid before auction ends (with penalty if applicable).
    /// @param auctionId The auction ID
    /// @param bidIndex Index of the bid to withdraw (use getAllBids to find index)
    function withdrawBid(uint256 auctionId, uint256 bidIndex) external {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(auction.state == AuctionState.Active, "NoLossAuction: auction not active");
        require(block.timestamp < auction.endTime, "NoLossAuction: auction ended");

        Bid[] storage auctionBids = bids[auctionId];
        require(bidIndex < auctionBids.length, "NoLossAuction: invalid bid index");

        Bid storage bid = auctionBids[bidIndex];
        require(bid.bidder == msg.sender, "NoLossAuction: not bid owner");
        require(!bid.withdrawn, "NoLossAuction: bid already withdrawn");
        require(!bid.refunded, "NoLossAuction: bid already refunded");
        require(!bid.expired, "NoLossAuction: bid expired");

        // Check if bidder is current highest bidder
        bool isHighestBidder = highestBidder[auctionId] == msg.sender;
        require(!isHighestBidder, "NoLossAuction: cannot withdraw highest bid");

        uint256 withdrawalAmount = bid.amount;
        uint256 penaltyAmount = 0;

        // Calculate penalty if applicable
        if (auction.withdrawalPenaltyBps > 0) {
            penaltyAmount = (withdrawalAmount * auction.withdrawalPenaltyBps) / 10_000;
            withdrawalAmount -= penaltyAmount;
        }

        // Update bid state
        bid.withdrawn = true;
        escrow[auctionId][msg.sender] -= bid.amount;
        bidderTotalBid[auctionId][msg.sender] -= bid.amount;
        totalBidAmount[auctionId] -= bid.amount;

        // Transfer withdrawal amount (after penalty)
        if (auction.paymentToken == address(0)) {
            if (withdrawalAmount > 0) {
                (bool success,) = payable(msg.sender).call{value: withdrawalAmount}("");
                require(success, "NoLossAuction: withdrawal transfer failed");
            }
            // Penalty stays in contract (can be sent to seller or treasury)
        } else {
            if (withdrawalAmount > 0) {
                _transferPaymentToken(msg.sender, auction.paymentToken, withdrawalAmount);
            }
        }

        emit BidWithdrawn(auctionId, msg.sender, withdrawalAmount, penaltyAmount);
    }

    /// @notice Withdraw all bids from a bidder (with penalties if applicable).
    /// @param auctionId The auction ID
    function withdrawAllBids(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(auction.state == AuctionState.Active, "NoLossAuction: auction not active");
        require(block.timestamp < auction.endTime, "NoLossAuction: auction ended");

        // Check if bidder is current highest bidder
        require(highestBidder[auctionId] != msg.sender, "NoLossAuction: cannot withdraw highest bid");

        Bid[] storage auctionBids = bids[auctionId];
        uint256 totalWithdrawal = 0;
        uint256 totalPenalty = 0;

        for (uint256 i = 0; i < auctionBids.length; i++) {
            Bid storage bid = auctionBids[i];
            if (
                bid.bidder == msg.sender &&
                !bid.withdrawn &&
                !bid.refunded &&
                !bid.expired
            ) {
                uint256 penalty = 0;
                if (auction.withdrawalPenaltyBps > 0) {
                    penalty = (bid.amount * auction.withdrawalPenaltyBps) / 10_000;
                    totalPenalty += penalty;
                }

                totalWithdrawal += bid.amount - penalty;
                bid.withdrawn = true;
            }
        }

        require(totalWithdrawal > 0, "NoLossAuction: no bids to withdraw");

        // Update escrow and totals
        uint256 totalToDeduct = totalWithdrawal + totalPenalty;
        escrow[auctionId][msg.sender] = 0;
        bidderTotalBid[auctionId][msg.sender] = 0;
        totalBidAmount[auctionId] -= totalToDeduct;
        totalEscrowed[auctionId] -= totalToDeduct;
        totalEscrowedByToken[auction.paymentToken] -= totalToDeduct;

        // Clear lock if exists
        EscrowLock storage lock = escrowLocks[auctionId][msg.sender];
        if (lock.locked) {
            lock.locked = false;
            lock.amount = 0;
        }

        // Transfer withdrawal amount
        if (auction.paymentToken == address(0)) {
            if (totalWithdrawal > 0) {
                (bool success,) = payable(msg.sender).call{value: totalWithdrawal}("");
                require(success, "NoLossAuction: withdrawal transfer failed");
            }
        } else {
            if (totalWithdrawal > 0) {
                _transferPaymentToken(msg.sender, auction.paymentToken, totalWithdrawal);
            }
        }

        emit BidWithdrawn(auctionId, msg.sender, totalWithdrawal, totalPenalty);
    }

    // =============================================================
    //                    BID EXPIRATION HANDLING
    // =============================================================

    /// @notice Check and handle expired bids for an auction.
    /// @param auctionId The auction ID
    function checkAndHandleExpiredBids(uint256 auctionId) external {
        _checkAndHandleExpiredBids(auctionId);
    }

    /// @notice Internal function to check and handle expired bids.
    function _checkAndHandleExpiredBids(uint256 auctionId) internal {
        Auction storage auction = auctions[auctionId];
        if (auction.bidExpirationPeriod == 0) {
            return; // No expiration
        }

        Bid[] storage auctionBids = bids[auctionId];
        address currentHighestBidder = highestBidder[auctionId];
        bool highestBidderExpired = false;

        // Process expired bids
        for (uint256 i = 0; i < auctionBids.length; i++) {
            Bid storage bid = auctionBids[i];
            if (
                !bid.expired &&
                !bid.withdrawn &&
                !bid.refunded &&
                bid.expirationTime > 0 &&
                block.timestamp >= bid.expirationTime
            ) {
                _processExpiredBid(auctionId, bid, auction.paymentToken);
                if (bid.bidder == currentHighestBidder) {
                    highestBidderExpired = true;
                }
            }
        }

        // Recalculate highest bidder if needed
        if (highestBidderExpired) {
            _recalculateHighestBidder(auctionId);
        }
    }

    /// @notice Process a single expired bid.
    function _processExpiredBid(uint256 auctionId, Bid storage bid, address paymentToken) internal {
        bid.expired = true;
        uint256 amount = bid.amount;
        address bidder = bid.bidder;

        // Update escrow tracking
        escrow[auctionId][bidder] -= amount;
        bidderTotalBid[auctionId][bidder] -= amount;
        totalBidAmount[auctionId] -= amount;
        totalEscrowed[auctionId] -= amount;
        totalEscrowedByToken[paymentToken] -= amount;

        // Update or clear lock
        EscrowLock storage lock = escrowLocks[auctionId][bidder];
        if (lock.locked) {
            lock.amount -= amount;
            if (lock.amount == 0) {
                lock.locked = false;
            }
        }

        // Refund expired bid
        if (paymentToken == address(0)) {
            (bool success,) = payable(bidder).call{value: amount}("");
            require(success, "NoLossAuction: expired bid refund failed");
        } else {
            _transferPaymentToken(bidder, paymentToken, amount);
        }

        emit BidExpired(auctionId, bidder, amount);
    }

    /// @notice Recalculate the highest bidder after expired bids are processed.
    function _recalculateHighestBidder(uint256 auctionId) internal {
        Bid[] storage auctionBids = bids[auctionId];
        uint256 newHighest = 0;
        address newHighestBidder = address(0);

        for (uint256 i = 0; i < auctionBids.length; i++) {
            Bid storage bid = auctionBids[i];
            if (!bid.expired && !bid.withdrawn && !bid.refunded) {
                address bidder = bid.bidder;
                uint256 total = bidderTotalBid[auctionId][bidder];
                if (total > newHighest) {
                    newHighest = total;
                    newHighestBidder = bidder;
                }
            }
        }

        highestBid[auctionId] = newHighest;
        highestBidder[auctionId] = newHighestBidder;
    }

    /// @notice Get effective highest bid (excluding expired/withdrawn bids).
    /// @param auctionId The auction ID
    /// @return effectiveHighest Effective highest bid amount
    function _getEffectiveHighestBid(uint256 auctionId) internal view returns (uint256) {
        address currentHighestBidder = highestBidder[auctionId];
        if (currentHighestBidder == address(0)) {
            return 0;
        }

        // Check if current highest bidder's bids are still valid
        Bid[] memory auctionBids = bids[auctionId];
        uint256 validTotal = 0;

        for (uint256 i = 0; i < auctionBids.length; i++) {
            if (
                auctionBids[i].bidder == currentHighestBidder &&
                !auctionBids[i].expired &&
                !auctionBids[i].withdrawn &&
                !auctionBids[i].refunded
            ) {
                validTotal += auctionBids[i].amount;
            }
        }

        return validTotal;
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

        // Handle expired bids before ending
        _checkAndHandleExpiredBids(auctionId);

        // Get effective highest bid after handling expired bids
        address winner = highestBidder[auctionId];
        uint256 winningBid = _getEffectiveHighestBid(auctionId);
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

        // Automatic settlement if enabled
        if (auction.autoSettleEnabled && reserveMet && winner != address(0)) {
            _automaticSettlement(auctionId, winner);
        }
    }

    /// @notice Execute automatic settlement (refund losing bidders automatically).
    /// @param auctionId The auction ID
    /// @param winner The auction winner
    function _automaticSettlement(uint256 auctionId, address winner) internal {
        Auction storage auction = auctions[auctionId];
        Bid[] storage auctionBids = bids[auctionId];

        // Refund all losing bidders
        for (uint256 i = 0; i < auctionBids.length; i++) {
            Bid storage bid = auctionBids[i];
            if (
                bid.bidder != winner &&
                !bid.refunded &&
                !bid.withdrawn &&
                !bid.expired &&
                escrow[auctionId][bid.bidder] > 0
            ) {
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

        emit AutomaticSettlementExecuted(auctionId, winner, highestBid[auctionId]);
    }

    /// @notice Manually trigger automatic settlement (if auto-settle was enabled but didn't execute).
    /// @param auctionId The auction ID
    function triggerAutomaticSettlement(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.state == AuctionState.Ended, "NoLossAuction: auction not ended");
        require(auction.autoSettleEnabled, "NoLossAuction: auto-settle not enabled");

        address winner = highestBidder[auctionId];
        require(winner != address(0), "NoLossAuction: no winner");

        _automaticSettlement(auctionId, winner);
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
                _refundFromEscrow(auctionId, bidder, "Auction cancelled");
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
    //                ENHANCED BID HISTORY TRACKING
    // =============================================================

    /// @notice Get bid history for a specific bidder.
    /// @param auctionId The auction ID
    /// @param bidder The bidder address
    /// @return bidderBids Array of bids from this bidder
    function getBidderBids(uint256 auctionId, address bidder)
        external
        view
        returns (Bid[] memory bidderBids)
    {
        Bid[] memory allBids = bids[auctionId];
        uint256 count = 0;

        // Count bids from this bidder
        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].bidder == bidder) {
                count++;
            }
        }

        // Create array with bids from this bidder
        bidderBids = new Bid[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].bidder == bidder) {
                bidderBids[index] = allBids[i];
                index++;
            }
        }

        return bidderBids;
    }

    /// @notice Get total bid amount for a specific bidder (excluding expired/withdrawn).
    /// @param auctionId The auction ID
    /// @param bidder The bidder address
    /// @return totalBid Total valid bid amount
    function getBidderTotalBid(uint256 auctionId, address bidder)
        external
        view
        returns (uint256 totalBid)
    {
        Bid[] memory allBids = bids[auctionId];
        totalBid = 0;

        for (uint256 i = 0; i < allBids.length; i++) {
            if (
                allBids[i].bidder == bidder &&
                !allBids[i].expired &&
                !allBids[i].withdrawn &&
                !allBids[i].refunded
            ) {
                totalBid += allBids[i].amount;
            }
        }

        return totalBid;
    }

    /// @notice Get highest bidder information.
    /// @param auctionId The auction ID
    /// @return bidder Highest bidder address
    /// @return amount Highest bid amount
    /// @return isValid Whether the highest bid is still valid (not expired/withdrawn)
    function getHighestBidderInfo(uint256 auctionId)
        external
        view
        returns (address bidder, uint256 amount, bool isValid)
    {
        bidder = highestBidder[auctionId];
        amount = highestBid[auctionId];
        isValid = bidder != address(0) && _getEffectiveHighestBid(auctionId) == amount;
    }

    /// @notice Get bid statistics for an auction.
    /// @param auctionId The auction ID
    /// @return totalBids Total number of bids
    /// @return validBids Number of valid (non-expired/withdrawn) bids
    /// @return expiredBids Number of expired bids
    /// @return withdrawnBids Number of withdrawn bids
    /// @return totalBidAmount_ Total bid amount (all bids)
    /// @return validBidAmount Total valid bid amount
    function getBidStatistics(uint256 auctionId)
        external
        view
        returns (
            uint256 totalBids,
            uint256 validBids,
            uint256 expiredBids,
            uint256 withdrawnBids,
            uint256 totalBidAmount_,
            uint256 validBidAmount
        )
    {
        Bid[] memory allBids = bids[auctionId];
        totalBids = allBids.length;
        totalBidAmount_ = totalBidAmount[auctionId];

        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].expired) {
                expiredBids++;
            } else if (allBids[i].withdrawn) {
                withdrawnBids++;
            } else if (!allBids[i].refunded) {
                validBids++;
                validBidAmount += allBids[i].amount;
            }
        }
    }

    /// @notice Check if a bid is expired.
    /// @param auctionId The auction ID
    /// @param bidIndex Index of the bid
    /// @return expired Whether the bid is expired
    function isBidExpired(uint256 auctionId, uint256 bidIndex) external view returns (bool) {
        Bid[] memory auctionBids = bids[auctionId];
        require(bidIndex < auctionBids.length, "NoLossAuction: invalid bid index");

        Bid memory bid = auctionBids[bidIndex];
        if (bid.expirationTime == 0) {
            return false; // No expiration
        }

        return block.timestamp >= bid.expirationTime || bid.expired;
    }

    /// @notice Get all valid (non-expired, non-withdrawn) bids for an auction.
    /// @param auctionId The auction ID
    /// @return validBids Array of valid bids
    function getValidBids(uint256 auctionId) external view returns (Bid[] memory validBids) {
        Bid[] memory allBids = bids[auctionId];
        uint256 count = 0;

        // Count valid bids
        for (uint256 i = 0; i < allBids.length; i++) {
            if (!allBids[i].expired && !allBids[i].withdrawn && !allBids[i].refunded) {
                count++;
            }
        }

        // Create array with valid bids
        validBids = new Bid[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allBids.length; i++) {
            if (!allBids[i].expired && !allBids[i].withdrawn && !allBids[i].refunded) {
                validBids[index] = allBids[i];
                index++;
            }
        }

        return validBids;
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

    // =============================================================
    //                    ENHANCED ESCROW SYSTEM
    // =============================================================

    /// @notice Deposit funds to escrow with enhanced tracking.
    /// @param auctionId The auction ID
    /// @param bidder The bidder address
    /// @param paymentToken The payment token address
    /// @param amount The amount to deposit
    function _depositToEscrow(uint256 auctionId, address bidder, address paymentToken, uint256 amount) internal {
        // Transfer payment to escrow
        if (paymentToken == address(0)) {
            // Native ETH already received via msg.value
            escrow[auctionId][bidder] += amount;
        } else {
            _transferPaymentTokenFrom(bidder, address(this), paymentToken, amount);
            escrow[auctionId][bidder] += amount;
        }

        // Update escrow tracking
        totalEscrowed[auctionId] += amount;
        totalEscrowedByToken[paymentToken] += amount;

        // Set up time lock if enabled
        Auction storage auction = auctions[auctionId];
        if (auction.withdrawalLockPeriod > 0) {
            EscrowLock storage lock = escrowLocks[auctionId][bidder];
            if (!lock.locked) {
                lock.amount = escrow[auctionId][bidder];
                lock.unlockTime = block.timestamp + auction.withdrawalLockPeriod;
                lock.locked = true;
                lock.paymentToken = paymentToken;
            } else {
                // Update existing lock
                lock.amount = escrow[auctionId][bidder];
                // Extend unlock time if new deposit extends it
                if (block.timestamp + auction.withdrawalLockPeriod > lock.unlockTime) {
                    lock.unlockTime = block.timestamp + auction.withdrawalLockPeriod;
                }
            }
        }

        emit EscrowDeposited(auctionId, bidder, paymentToken, amount);
    }

    /// @notice Withdraw from escrow (with time lock check).
    /// @param auctionId The auction ID
    /// @param amount The amount to withdraw
    function withdrawFromEscrow(uint256 auctionId, uint256 amount) external {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionId == auctionId, "NoLossAuction: auction does not exist");
        require(escrow[auctionId][msg.sender] >= amount, "NoLossAuction: insufficient escrow balance");
        require(amount > 0, "NoLossAuction: amount is zero");

        // Check time lock if enabled
        EscrowLock storage lock = escrowLocks[auctionId][msg.sender];
        if (lock.locked) {
            require(block.timestamp >= lock.unlockTime, "NoLossAuction: withdrawal still locked");
        }

        // Update escrow
        escrow[auctionId][msg.sender] -= amount;
        totalEscrowed[auctionId] -= amount;
        address paymentToken = auction.paymentToken;
        totalEscrowedByToken[paymentToken] -= amount;

        // Update or clear lock
        if (lock.locked) {
            lock.amount -= amount;
            if (lock.amount == 0) {
                lock.locked = false;
            }
        }

        // Transfer funds
        if (paymentToken == address(0)) {
            (bool success,) = payable(msg.sender).call{value: amount}("");
            require(success, "NoLossAuction: withdrawal transfer failed");
        } else {
            _transferPaymentToken(msg.sender, paymentToken, amount);
        }

        emit EscrowWithdrawn(auctionId, msg.sender, paymentToken, amount, lock.locked ? lock.unlockTime : 0);
    }

    /// @notice Check if escrow is unlocked for withdrawal.
    /// @param auctionId The auction ID
    /// @param bidder The bidder address
    /// @return unlocked Whether the escrow is unlocked
    /// @return unlockTime The unlock timestamp (0 if not locked)
    function isEscrowUnlocked(uint256 auctionId, address bidder)
        external
        view
        returns (bool unlocked, uint256 unlockTime)
    {
        EscrowLock memory lock = escrowLocks[auctionId][bidder];
        if (!lock.locked) {
            return (true, 0);
        }
        unlocked = block.timestamp >= lock.unlockTime;
        unlockTime = lock.unlockTime;
    }

    /// @notice Get escrow details for a bidder.
    /// @param auctionId The auction ID
    /// @param bidder The bidder address
    /// @return amount Escrowed amount
    /// @return lockDetails Escrow lock details
    function getEscrowDetails(uint256 auctionId, address bidder)
        external
        view
        returns (uint256 amount, EscrowLock memory lockDetails)
    {
        amount = escrow[auctionId][bidder];
        lockDetails = escrowLocks[auctionId][bidder];
    }

    /// @notice Enhanced refund mechanism with automatic processing.
    /// @param auctionId The auction ID
    /// @param bidder The bidder to refund
    /// @param reason Reason for refund
    function _refundFromEscrow(uint256 auctionId, address bidder, string memory reason) internal {
        Auction storage auction = auctions[auctionId];
        uint256 refundAmount = escrow[auctionId][bidder];
        require(refundAmount > 0, "NoLossAuction: no funds to refund");

        address paymentToken = auction.paymentToken;

        // Clear escrow
        escrow[auctionId][bidder] = 0;
        totalEscrowed[auctionId] -= refundAmount;
        totalEscrowedByToken[paymentToken] -= refundAmount;

        // Clear lock if exists
        EscrowLock storage lock = escrowLocks[auctionId][bidder];
        if (lock.locked) {
            lock.locked = false;
            lock.amount = 0;
        }

        // Transfer refund
        if (paymentToken == address(0)) {
            (bool success,) = payable(bidder).call{value: refundAmount}("");
            require(success, "NoLossAuction: refund transfer failed");
        } else {
            _transferPaymentToken(bidder, paymentToken, refundAmount);
        }

        emit EscrowRefunded(auctionId, bidder, paymentToken, refundAmount, reason);
    }

    /// @notice Get total escrowed amount for an auction.
    /// @param auctionId The auction ID
    /// @return total Total escrowed amount
    function getTotalEscrowed(uint256 auctionId) external view returns (uint256 total) {
        return totalEscrowed[auctionId];
    }

    /// @notice Get total escrowed amount for a payment token across all auctions.
    /// @param paymentToken The payment token address
    /// @return total Total escrowed amount for this token
    function getTotalEscrowedByToken(address paymentToken) external view returns (uint256 total) {
        return totalEscrowedByToken[paymentToken];
    }

    /// @notice Set withdrawal lock period for an auction (only owner/manager).
    /// @param auctionId The auction ID
    /// @param lockPeriod Lock period in seconds
    function setWithdrawalLockPeriod(uint256 auctionId, uint256 lockPeriod) external onlyOwnerOrManager {
        require(auctions[auctionId].auctionId == auctionId, "NoLossAuction: auction does not exist");
        withdrawalLockPeriod[auctionId] = lockPeriod;
        auctions[auctionId].withdrawalLockPeriod = lockPeriod;
    }

    // Receive ETH
    receive() external payable {}
}

