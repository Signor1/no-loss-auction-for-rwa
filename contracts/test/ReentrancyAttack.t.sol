// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/NoLossAuction.sol";
import "../src/RWAAssetNFT.sol";
import "../src/lib/IERC20.sol";
import "../src/lib/ReentrancyGuard.sol";

contract MaliciousBidder {
    NoLossAuction public auction;
    uint256 public auctionId;
    bool public attemptReentry;

    constructor(address _auction) {
        auction = NoLossAuction(payable(_auction));
    }

    // Fallback to receive ETH
    receive() external payable {
        if (attemptReentry) {
            attemptReentry = false; // Prevent infinite loop
            // Attempt to withdraw again or place bid during withdrawal (reentrancy)
            // For this test, we try to call withdrawBid again
            // We need to know the bid index. In a real attack, we'd track it.
            // Here we assume checking index 0 for simplicity or just trying ANY state change
            try auction.withdrawBid(auctionId, 0) {
                // Succeeded (Bad)
            } catch {
                // Failed (Good)
            }
        }
    }

    function placeBid(uint256 _auctionId, uint256 _bidAmount) external payable {
        auctionId = _auctionId;
        auction.placeBid{value: _bidAmount}(_auctionId, _bidAmount);
    }

    function attackWithdraw(uint256 _auctionId, uint256 _bidIndex) external {
        auctionId = _auctionId;
        attemptReentry = true;
        auction.withdrawBid(_auctionId, _bidIndex);
    }
}

contract ReentrancyAttackTest is Test {
    NoLossAuction public auction;
    RWAAssetNFT public nft;
    address public seller;
    address public maliciousUser;
    uint256 public auctionId;

    function setUp() public {
        seller = makeAddr("seller");
        maliciousUser = address(new MaliciousBidder(address(0))); // Placeholder, updated below

        // Deploy contracts
        nft = new RWAAssetNFT("RWA NFT", "RWANFT", address(this), false);
        auction = new NoLossAuction(address(this));

        // Update malicious user with real auction address
        maliciousUser = address(new MaliciousBidder(address(auction)));

        // Setup auction
        nft.mint(seller, 1);
        
        vm.startPrank(seller);
        nft.approve(address(auction), 1);
        
        auctionId = auction.createAuction(
            address(nft),
            1,
            1, // Asset amount
            0.1 ether, // Reserve
            block.timestamp, // Start time
            block.timestamp + 1 days, // End time
            0.01 ether, // Increment
            address(0), // ETH
            0, // No expiration
            0, // No penalty
            false, // Auto settle
            0, // No lock
            false // Secure escrow
        );
        vm.stopPrank();
    }

    function testReentrancyProtectionOnWithdraw() public {
        // 1. Malicious user places bid
        vm.deal(maliciousUser, 10 ether);
        MaliciousBidder(payable(maliciousUser)).placeBid(auctionId, 1 ether);

        // 2. Another user places a higher bid so MaliciousUser is not highest bidder anymore
        address otherBidder = makeAddr("otherBidder");
        vm.deal(otherBidder, 10 ether);
        vm.prank(otherBidder);
        auction.placeBid{value: 2 ether}(auctionId, 2 ether);

        // 3. Malicious user tries to withdraw and re-enter
        // The MaliciousBidder contract will try to call withdrawBid again in its receive() fallback
        // expecting to double spend or corrupt state if nonReentrant wasn't there.
        // With ReentrancyGuard, the second call should revert.
        
        uint256 balanceBefore = maliciousUser.balance;
        MaliciousBidder(payable(maliciousUser)).attackWithdraw(auctionId, 0);
        uint256 balanceAfter = maliciousUser.balance;

        // The malicious user started with 10 ETH, bid 1 ETH (leaving 9 ETH)
        // After withdrawal, they should get 1 ETH back = 10 ETH total
        // If reentrancy worked, they'd have 11 ETH (double withdrawal)
        assertEq(balanceAfter, 10 ether, "Malicious user should have exactly 10 ETH (reentrancy blocked)");
        assertEq(balanceAfter - balanceBefore, 1 ether, "Should only withdraw once");
        
        // Check escrow is empty
        uint256 escrowAmount = auction.escrow(auctionId, maliciousUser);
        assertEq(escrowAmount, 0, "Escrow should be empty");
    }
}
