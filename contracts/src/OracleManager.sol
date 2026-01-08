// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./lib/AggregatorV3Interface.sol";

/// @title OracleManager
/// @notice Manages Chainlink price feeds, aggregation, and historical tracking for RWAs.
contract OracleManager {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event FeedAdded(uint256 indexed assetId, address indexed feed);
    event SnapshotTaken(uint256 indexed assetId, uint256 price, uint256 timestamp);
    event PriceDeviationConstraintBroken(uint256 indexed assetId, uint256 percentDeviation, uint256 newPrice, uint256 oldPrice);
    event DeviationThresholdUpdated(uint256 newThreshold);

    // =============================================================
    //                          STRUCTS
    // =============================================================

    struct PriceHistory {
        uint256 price;
        uint256 timestamp;
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    mapping(uint256 => address[]) public assetFeeds;
    mapping(uint256 => PriceHistory[]) public assetPriceHistory;
    
    uint256 public deviationThresholdPercent = 5; // 5% default
    uint256 public constant STALENESS_THRESHOLD = 3 hours; 

    address public admin;

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "OracleManager: not admin");
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

    function addFeed(uint256 assetId, address feed) external onlyAdmin {
        require(feed != address(0), "OracleManager: zero address");
        // Verify it looks like a feed
        try AggregatorV3Interface(feed).decimals() returns (uint8) {
            assetFeeds[assetId].push(feed);
            emit FeedAdded(assetId, feed);
        } catch {
            revert("OracleManager: invalid feed");
        }
    }

    function setDeviationThreshold(uint256 _percent) external onlyAdmin {
        deviationThresholdPercent = _percent;
        emit DeviationThresholdUpdated(_percent);
    }

    // =============================================================
    //                    PUBLIC FUNCTIONS
    // =============================================================

    /// @notice Get the aggregated price for an asset.
    /// @dev Median of all feeds, normalized to 18 decimals.
    function getAssetPrice(uint256 assetId) public view returns (uint256) {
        address[] memory feeds = assetFeeds[assetId];
        require(feeds.length > 0, "OracleManager: no feeds");

        uint256[] memory prices = new uint256[](feeds.length);
        uint256 validCount = 0;

        for (uint256 i = 0; i < feeds.length; i++) {
            (
                /*uint80 roundId*/,
                int256 answer,
                /*uint256 startedAt*/,
                uint256 updatedAt,
                /*uint80 answeredInRound*/
            ) = AggregatorV3Interface(feeds[i]).latestRoundData();

            require(updatedAt + STALENESS_THRESHOLD > block.timestamp, "OracleManager: stale price");
            require(answer > 0, "OracleManager: negative/zero price");

            uint8 decimals = AggregatorV3Interface(feeds[i]).decimals();
            
            // Normalize to 18 decimals
            uint256 normalizedPrice = uint256(answer);
            if (decimals < 18) {
                normalizedPrice = normalizedPrice * (10 ** (18 - decimals));
            } else if (decimals > 18) {
                normalizedPrice = normalizedPrice / (10 ** (decimals - 18));
            }

            prices[validCount] = normalizedPrice;
            validCount++;
        }

        return _median(prices);
    }

    /// @notice Take a snapshot of the current price for historical tracking.
    /// @dev Checks for deviation against the last snapshot.
    function snapshotAssetPrice(uint256 assetId) external returns (uint256) {
        uint256 currentPrice = getAssetPrice(assetId);

        PriceHistory[] storage history = assetPriceHistory[assetId];
        
        if (history.length > 0) {
            uint256 lastPrice = history[history.length - 1].price;
            uint256 deviation = 0;
            
            if (currentPrice > lastPrice) {
                deviation = ((currentPrice - lastPrice) * 100) / lastPrice;
            } else {
                deviation = ((lastPrice - currentPrice) * 100) / lastPrice;
            }

            if (deviation >= deviationThresholdPercent) {
                emit PriceDeviationConstraintBroken(assetId, deviation, currentPrice, lastPrice);
            }
        }

        history.push(PriceHistory({
            price: currentPrice,
            timestamp: block.timestamp
        }));

        emit SnapshotTaken(assetId, currentPrice, block.timestamp);
        return currentPrice;
    }

    function getHistory(uint256 assetId) external view returns (PriceHistory[] memory) {
        return assetPriceHistory[assetId];
    }

    // =============================================================
    //                    INTERNAL HELPERS
    // =============================================================

    function _median(uint256[] memory prices) internal pure returns (uint256) {
        // Sort
        for (uint256 i = 0; i < prices.length; i++) {
            for (uint256 j = i + 1; j < prices.length; j++) {
                if (prices[i] > prices[j]) {
                    uint256 temp = prices[i];
                    prices[i] = prices[j];
                    prices[j] = temp;
                }
            }
        }

        if (prices.length % 2 == 0) {
            return (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
        } else {
            return prices[prices.length / 2];
        }
    }
}
