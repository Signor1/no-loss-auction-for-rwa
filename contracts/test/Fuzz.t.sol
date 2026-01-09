// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/NoLossAuction.sol";
import "../src/RWAAssetNFT.sol";

/// @title Fuzz Test Suite
/// @notice Fuzz testing for critical auction functions
contract FuzzTest is Test {
    NoLossAuction public auction;
    RWAAssetNFT public nft;
    
    address public owner;
    address public seller;
    uint256 public auctionId;

    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");

        nft = new RWAAssetNFT("RWA NFT", "RWANFT", owner, false);
        auction = new NoLossAuction(owner);

        // Create a standard auction for testing
        nft.mint(seller, 1);
        
        vm.startPrank(seller);
        nft.approve(address(auction), 1);
        
        auctionId = auction.createAuction(
            address(nft),
            1,
            1,
            1 ether, // Reserve
            block.timestamp,
            block.timestamp + 7 days,
            0.01 ether, // Min increment
            address(0),
            0,
            0,
            false,
            0,
            false
        );
        vm.stopPrank();
    }

    /// @notice Fuzz test for bid amounts
    /// @dev Tests that bids work correctly across a wide range of values
    function testFuzz_BidAmounts(uint256 bidAmount) public {
        // Bound bid amount to reasonable range
        bidAmount = bound(bidAmount, 1 ether, 1000 ether);
        
        address bidder = makeAddr("bidder");
        vm.deal(bidder, bidAmount);
        
        vm.prank(bidder);
        auction.placeBid{value: bidAmount}(auctionId, bidAmount);
        
        // Verify bid was recorded
        assertEq(auction.highestBid(auctionId), bidAmount, "Highest bid should match");
        assertEq(auction.highestBidder(auctionId), bidder, "Highest bidder should match");
    }

    /// @notice Fuzz test for multiple sequential bids
    function testFuzz_MultipleBids(uint8 numBidders, uint256 baseBid) public {
        // Bound inputs
        numBidders = uint8(bound(numBidders, 1, 10));
        baseBid = bound(baseBid, 1 ether, 10 ether);
        
        address highestBidder;
        uint256 highestBidAmount = 0;
        
        for (uint256 i = 0; i < numBidders; i++) {
            address bidder = makeAddr(string(abi.encodePacked("bidder", i)));
            uint256 bidAmount = baseBid + (i * 0.1 ether);
            
            vm.deal(bidder, bidAmount);
            vm.prank(bidder);
            auction.placeBid{value: bidAmount}(auctionId, bidAmount);
            
            if (bidAmount > highestBidAmount) {
                highestBidAmount = bidAmount;
                highestBidder = bidder;
            }
        }
        
        // Verify final state
        assertEq(auction.highestBid(auctionId), highestBidAmount, "Final highest bid should match");
        assertEq(auction.highestBidder(auctionId), highestBidder, "Final highest bidder should match");
    }

    /// @notice Fuzz test for auction timing
    function testFuzz_AuctionTiming(uint256 timeWarp) public {
        // Bound time warp to reasonable range (0 to 30 days)
        timeWarp = bound(timeWarp, 0, 30 days);
        
        address bidder = makeAddr("bidder");
        vm.deal(bidder, 10 ether);
        
        vm.prank(bidder);
        auction.placeBid{value: 1 ether}(auctionId, 1 ether);
        
        // Warp time
        vm.warp(block.timestamp + timeWarp);
        
        // Try to end auction
        if (timeWarp >= 7 days) {
            // Should succeed
            auction.endAuction(auctionId);
            assertEq(nft.ownerOf(1), bidder, "NFT should transfer to bidder");
        } else {
            // Should fail
            vm.expectRevert();
            auction.endAuction(auctionId);
        }
    }

    /// @notice Fuzz test for bid increments
    function testFuzz_BidIncrements(uint256 firstBid, uint256 increment) public {
        // Bound inputs
        firstBid = bound(firstBid, 1 ether, 10 ether);
        increment = bound(increment, 0.01 ether, 5 ether);
        
        address bidder1 = makeAddr("bidder1");
        address bidder2 = makeAddr("bidder2");
        
        vm.deal(bidder1, firstBid);
        vm.deal(bidder2, firstBid + increment);
        
        // First bid
        vm.prank(bidder1);
        auction.placeBid{value: firstBid}(auctionId, firstBid);
        
        // Second bid with increment
        uint256 secondBid = firstBid + increment;
        vm.prank(bidder2);
        
        if (increment >= 0.01 ether) {
            // Should succeed
            auction.placeBid{value: secondBid}(auctionId, secondBid);
            assertEq(auction.highestBidder(auctionId), bidder2, "Bidder2 should be highest");
        } else {
            // Should fail (increment too small)
            vm.expectRevert();
            auction.placeBid{value: secondBid}(auctionId, secondBid);
        }
    }

    /// @notice Fuzz test for withdrawal scenarios
    function testFuzz_Withdrawals(uint256 bidAmount, uint256 withdrawDelay) public {
        // Bound inputs
        bidAmount = bound(bidAmount, 1 ether, 100 ether);
        withdrawDelay = bound(withdrawDelay, 0, 6 days);
        
        address bidder = makeAddr("bidder");
        vm.deal(bidder, bidAmount);
        
        // Place first bid
        vm.prank(bidder);
        auction.placeBid{value: bidAmount}(auctionId, bidAmount);
        
        // Outbid them so they are no longer highest bidder
        address outbidder = makeAddr("outbidder");
        uint256 outbidAmount = bidAmount + 1 ether;
        vm.deal(outbidder, outbidAmount);
        vm.prank(outbidder);
        auction.placeBid{value: outbidAmount}(auctionId, outbidAmount);
        
        // Wait
        vm.warp(block.timestamp + withdrawDelay);
        
        // Try to withdraw (this was the first bid of the auction, should be index 0)
        vm.prank(bidder);
        auction.withdrawBid(auctionId, 0);
        
        assertEq(bidder.balance, bidAmount, "Bidder should get full refund after being outbid");
    }

    receive() external payable {}
}
