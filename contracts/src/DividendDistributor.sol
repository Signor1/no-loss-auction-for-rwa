// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./RWAFractionalToken.sol";
import "./lib/IERC20.sol";
import "./lib/SafeERC20.sol";
import "./lib/ReentrancyGuard.sol";

/// @title DividendDistributor
/// @notice Manages dividend/yield distribution for fractional token holders.
/// @dev Uses the snapshot mechanism of RWAFractionalToken to calculate entitlements.
contract DividendDistributor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event DividendDeposited(uint256 indexed roundId, address indexed token, uint256 amount, uint256 snapshotId);
    event DividendClaimed(address indexed claimer, uint256 indexed roundId, uint256 amount);

    // =============================================================
    //                          STRUCTS
    // =============================================================

    struct DistributionRound {
        uint256 roundId;
        address rewardToken;
        uint256 amount;
        uint256 snapshotId;
        uint256 totalSupplyAtSnapshot;
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    RWAFractionalToken public immutable fractionalToken;
    address public immutable engine;

    DistributionRound[] public rounds;
    
    // Mapping from holder => roundId => claimed status
    mapping(address => mapping(uint256 => bool)) public hasClaimed;

    modifier onlyEngine() {
        require(msg.sender == engine, "DividendDistributor: not engine");
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(address _fractionalToken, address _engine) {
        require(_fractionalToken != address(0), "DividendDistributor: token is zero");
        require(_engine != address(0), "DividendDistributor: engine is zero");
        
        fractionalToken = RWAFractionalToken(_fractionalToken);
        engine = _engine;
    }

    // =============================================================
    //                     DEPOSIT LOGIC
    // =============================================================

    /// @notice Deposit rewards for distribution.
    /// @dev Triggers a snapshot on the token contract to fix balances.
    /// @param rewardToken Address of the reward token (e.g., USDC)
    /// @param amount Amount of rewards to distribute
    function depositDividend(address rewardToken, uint256 amount) external nonReentrant {
        require(rewardToken != address(0), "DividendDistributor: token is zero");
        require(amount > 0, "DividendDistributor: amount is zero");

        // Transfer rewards to this contract
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), amount);

        // Limit access to snapshot creation if needed, but here we assume anyone can deposit dividends
        // However, only the owner/engine can trigger snapshot on the token contract.
        // If the distributor is approved as compliance admin or owner, it can call snapshot.
        // Otherwise, we might need to rely on an existing snapshot or call snapshot via engine.
        // For this design, we assume the Distributor is given permissions or the Engine calls this.
        
        // Actually, to make it simple: 
        // 1. We require the caller to trigger the snapshot separately OR 
        // 2. The token allows this contract to call snapshot.
        // Let's assume the TokenizationEngine owns the token, so we might need the Engine to facilitate this 
        // or we grant this contract a role.
        
        // For now, let's try to call snapshot(). If it fails, we revert.
        // Ideally, `depositDividend` should be callable by anyone (e.g. paying rent), 
        // so we can't expect them to own the token.
        // Solution: The contract calls `fractionalToken.snapshot()`. 
        // We must ensure `DividendDistributor` is set as `complianceAdmin` or `owner` of `fractionalToken`.
        // We will handle this in `TokenizationEngine`.

        uint256 snapshotId = fractionalToken.snapshot();
        uint256 supply = fractionalToken.totalSupplyAt(snapshotId);

        require(supply > 0, "DividendDistributor: no supply");

        rounds.push(DistributionRound({
            roundId: rounds.length,
            rewardToken: rewardToken,
            amount: amount,
            snapshotId: snapshotId,
            totalSupplyAtSnapshot: supply
        }));

        emit DividendDeposited(rounds.length - 1, rewardToken, amount, snapshotId);
    }

    // =============================================================
    //                      CLAIM LOGIC
    // =============================================================

    /// @notice Claim dividends for a specific round.
    /// @param roundId ID of the distribution round
    function claimDividend(uint256 roundId) external nonReentrant {
        require(roundId < rounds.length, "DividendDistributor: invalid round");
        require(!hasClaimed[msg.sender][roundId], "DividendDistributor: already claimed");

        DistributionRound memory round = rounds[roundId];
        
        // Calculate entitlement
        uint256 balanceAtSnapshot = fractionalToken.balanceOfAt(msg.sender, round.snapshotId);
        require(balanceAtSnapshot > 0, "DividendDistributor: no balance at snapshot");

        uint256 entitlement = (round.amount * balanceAtSnapshot) / round.totalSupplyAtSnapshot;
        require(entitlement > 0, "DividendDistributor: zero entitlement");

        hasClaimed[msg.sender][roundId] = true;

        IERC20(round.rewardToken).safeTransfer(msg.sender, entitlement);

        emit DividendClaimed(msg.sender, roundId, entitlement);
    }
    
    /// @notice Claim all available dividends across all rounds.
    function claimAll() external nonReentrant {
        uint256 length = rounds.length;
        for (uint256 i = 0; i < length; i++) {
            if (!hasClaimed[msg.sender][i]) {
                DistributionRound memory round = rounds[i];
                uint256 balanceAtSnapshot = fractionalToken.balanceOfAt(msg.sender, round.snapshotId);
                
                if (balanceAtSnapshot > 0) {
                    uint256 entitlement = (round.amount * balanceAtSnapshot) / round.totalSupplyAtSnapshot;
                    if (entitlement > 0) {
                        hasClaimed[msg.sender][i] = true;
                        IERC20(round.rewardToken).safeTransfer(msg.sender, entitlement);
                        emit DividendClaimed(msg.sender, i, entitlement);
                    }
                }
            }
        }
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    function getRoundCount() external view returns (uint256) {
        return rounds.length;
    }

    function getClaimableAmount(address user, uint256 roundId) external view returns (uint256) {
        if (roundId >= rounds.length || hasClaimed[user][roundId]) {
            return 0;
        }

        DistributionRound memory round = rounds[roundId];
        uint256 balanceAtSnapshot = fractionalToken.balanceOfAt(user, round.snapshotId);
        
        if (balanceAtSnapshot == 0) return 0;
        
        return (round.amount * balanceAtSnapshot) / round.totalSupplyAtSnapshot;
    }
}
