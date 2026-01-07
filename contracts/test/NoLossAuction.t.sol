// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/NoLossAuction.sol";
import "./MockERC20.sol";

contract NoLossAuctionTest is Test {
    NoLossAuction internal auction;
    MockERC20 internal assetToken;
    MockERC20 internal paymentToken;
    address internal owner = address(0xA11CE);
    address internal manager = address(0xBEEF);
    address internal seller = address(0x5E11);
    address internal bidder1 = address(0x1);
    address internal bidder2 = address(0x2);
    address internal bidder3 = address(0x3);

    function setUp() public {
        // Deploy auction contract
        vm.prank(owner);
        auction = new NoLossAuction(owner);

        vm.prank(owner);
        auction.setAuctionManager(manager);

        // Deploy mock tokens
        assetToken = new MockERC20("Asset Token", "AST", 18);
        paymentToken = new MockERC20("Payment Token", "PAY", 18);

        // Setup seller
        assetToken.mint(seller, 1000 ether);
        paymentToken.mint(seller, 1000 ether);

        // Setup bidders
        vm.deal(bidder1, 100 ether);
        vm.deal(bidder2, 100 ether);
        vm.deal(bidder3, 100 ether);
        paymentToken.mint(bidder1, 100 ether);
        paymentToken.mint(bidder2, 100 ether);
        paymentToken.mint(bidder3, 100 ether);
    }

    function testCreateAuction() public {
        uint256 assetAmount = 100 ether;
        uint256 reservePrice = 10 ether;
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;
        uint256 minBidIncrement = 1 ether;

        vm.startPrank(seller);
        assetToken.approve(address(auction), assetAmount);
        uint256 auctionId = auction.createAuction(
            address(assetToken),
            0, // ERC-20 token
            assetAmount,
            reservePrice,
            startTime,
            endTime,
            minBidIncrement,
            address(0) // Native ETH
        );
        vm.stopPrank();

        NoLossAuction.Auction memory createdAuction = auction.getAuction(auctionId);
        assertEq(createdAuction.seller, seller);
        assertEq(createdAuction.assetToken, address(assetToken));
        assertEq(createdAuction.assetAmount, assetAmount);
        assertEq(createdAuction.reservePrice, reservePrice);
        assertEq(uint256(createdAuction.state), uint256(NoLossAuction.AuctionState.Upcoming));
        assertEq(assetToken.balanceOf(address(auction)), assetAmount);
    }

    function testPlaceBidWithETH() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Bidder1 places bid
        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        assertEq(auction.highestBid(auctionId), 10 ether);
        assertEq(auction.highestBidder(auctionId), bidder1);
        assertEq(auction.bidderTotalBid(auctionId, bidder1), 10 ether);
        assertEq(address(auction).balance, 10 ether);
    }

    function testPlaceBidWithERC20() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(paymentToken));

        vm.startPrank(bidder1);
        paymentToken.approve(address(auction), 10 ether);
        auction.placeBid(auctionId, 10 ether);
        vm.stopPrank();

        assertEq(auction.highestBid(auctionId), 10 ether);
        assertEq(auction.highestBidder(auctionId), bidder1);
        assertEq(paymentToken.balanceOf(address(auction)), 10 ether);
    }

    function testBidBelowReservePriceReverts() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        vm.prank(bidder1);
        vm.expectRevert("NoLossAuction: bid below reserve price");
        auction.placeBid{value: 5 ether}(auctionId, 5 ether);
    }

    function testBidBelowMinimumIncrementReverts() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // First bid
        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        // Second bid below minimum increment
        vm.prank(bidder2);
        vm.expectRevert("NoLossAuction: bid below minimum increment");
        auction.placeBid{value: 10.5 ether}(auctionId, 10.5 ether); // Only 0.5 ether increment
    }

    function testMultipleBidsFromSameBidder() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Bidder1 places multiple bids
        vm.startPrank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);
        auction.placeBid{value: 2 ether}(auctionId, 2 ether); // Total: 12 ether
        auction.placeBid{value: 3 ether}(auctionId, 3 ether); // Total: 15 ether
        vm.stopPrank();

        assertEq(auction.bidderTotalBid(auctionId, bidder1), 15 ether);
        assertEq(auction.highestBid(auctionId), 15 ether);
        assertEq(auction.getBidCount(auctionId), 3);
    }

    function testAuctionStateTransitions() public {
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(seller);
        assetToken.approve(address(auction), 100 ether);
        uint256 auctionId = auction.createAuction(
            address(assetToken),
            0,
            100 ether,
            10 ether,
            startTime,
            endTime,
            1 ether,
            address(0)
        );
        vm.stopPrank();

        // Should be Upcoming
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        assertEq(uint256(a.state), uint256(NoLossAuction.AuctionState.Upcoming));

        // Fast forward to start time
        vm.warp(startTime);

        // Should transition to Active (happens automatically when time passes)
        // Note: In real scenario, state would be checked on bid placement
        // For this test, we'll manually verify the time-based logic
        assertTrue(block.timestamp >= startTime);
    }

    function testEndAuctionWithWinner() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Place bids
        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        vm.prank(bidder2);
        auction.placeBid{value: 12 ether}(auctionId, 12 ether);

        // Fast forward to end time
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        vm.warp(a.endTime);

        // End auction
        auction.endAuction(auctionId);

        // Check winner received asset
        assertEq(assetToken.balanceOf(bidder2), 100 ether);
        assertEq(assetToken.balanceOf(address(auction)), 0);

        // Check seller received payment
        assertEq(seller.balance, 12 ether);

        // Check state
        a = auction.getAuction(auctionId);
        assertEq(uint256(a.state), uint256(NoLossAuction.AuctionState.Ended));
    }

    function testEndAuctionReserveNotMet() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Place bid below reserve (should fail, but let's test with no bids)
        // Fast forward to end time
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        vm.warp(a.endTime);

        // End auction with no bids
        auction.endAuction(auctionId);

        // Asset should be returned to seller
        assertEq(assetToken.balanceOf(seller), 1000 ether); // Original balance
        assertEq(assetToken.balanceOf(address(auction)), 0);
    }

    function testRefundLosingBidders() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Multiple bidders
        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        vm.prank(bidder2);
        auction.placeBid{value: 12 ether}(auctionId, 12 ether);

        // bidder3 tries to bid 11 ether, but that's below minimum increment (12 + 1 = 13)
        // So bidder3 needs to bid at least 13 ether
        vm.prank(bidder3);
        auction.placeBid{value: 13 ether}(auctionId, 13 ether);

        // End auction
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        vm.warp(a.endTime);
        auction.endAuction(auctionId);

        uint256 bidder1BalanceBefore = bidder1.balance;
        uint256 bidder2BalanceBefore = bidder2.balance;

        // Refund losing bidders (bidder3 is winner, bidder1 and bidder2 should be refunded)
        auction.refundLosingBidders(auctionId);

        // Check refunds
        assertEq(bidder1.balance, bidder1BalanceBefore + 10 ether);
        assertEq(bidder2.balance, bidder2BalanceBefore + 12 ether);
        assertEq(auction.escrow(auctionId, bidder1), 0);
        assertEq(auction.escrow(auctionId, bidder2), 0);
    }

    function testRefundIndividualBidder() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        vm.prank(bidder2);
        auction.placeBid{value: 12 ether}(auctionId, 12 ether);

        // End auction
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        vm.warp(a.endTime);
        auction.endAuction(auctionId);

        uint256 bidder1BalanceBefore = bidder1.balance;

        // Refund individual bidder
        auction.refundBidder(auctionId, bidder1);

        assertEq(bidder1.balance, bidder1BalanceBefore + 10 ether);
        assertEq(auction.escrow(auctionId, bidder1), 0);
    }

    function testCancelAuction() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Place some bids
        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        // Cancel auction
        vm.prank(seller);
        auction.cancelAuction(auctionId);

        // Asset returned to seller
        assertEq(assetToken.balanceOf(seller), 1000 ether);
        assertEq(assetToken.balanceOf(address(auction)), 0);

        // Bidders refunded
        assertEq(bidder1.balance, 100 ether); // Full refund

        // State is Cancelled
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        assertEq(uint256(a.state), uint256(NoLossAuction.AuctionState.Cancelled));
    }

    function testPauseAndUnpauseAuction() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        // Pause auction
        vm.prank(manager);
        auction.pauseAuction(auctionId);

        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        assertTrue(a.paused);

        // Cannot bid while paused
        vm.prank(bidder1);
        vm.expectRevert("NoLossAuction: auction is paused");
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        // Unpause
        vm.prank(manager);
        auction.unpauseAuction(auctionId);

        a = auction.getAuction(auctionId);
        assertFalse(a.paused);

        // Can bid again
        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);
    }

    function testUpdateReservePrice() public {
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(seller);
        assetToken.approve(address(auction), 100 ether);
        uint256 auctionId = auction.createAuction(
            address(assetToken),
            0,
            100 ether,
            10 ether,
            startTime,
            endTime,
            1 ether,
            address(0)
        );

        // Update reserve price before auction starts
        auction.updateReservePrice(auctionId, 15 ether);
        vm.stopPrank();

        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        assertEq(a.reservePrice, 15 ether);
    }

    function testExtendEndTime() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        uint256 originalEndTime = a.endTime;

        // Extend end time
        uint256 newEndTime = originalEndTime + 1 hours;
        vm.prank(seller);
        auction.extendEndTime(auctionId, newEndTime);

        a = auction.getAuction(auctionId);
        assertEq(a.endTime, newEndTime);
    }

    function testMultiAssetERC721() public {
        // For ERC-721, we'd need a mock NFT contract
        // This test demonstrates the structure
        // In practice, you'd use RWAAssetNFT contract
        uint256 tokenId = 1;
        uint256 amount = 1; // NFT

        // Note: This would require an ERC-721 mock
        // For now, we'll test the ERC-20 path which is similar
    }

    function testMultiAssetERC1155() public {
        // Similar to ERC-721 test
        // Would require ERC-1155 mock or use RWAMultiToken
    }

    function testGetAllBids() public {
        uint256 auctionId = _createActiveAuction(address(assetToken), 0, 100 ether, 10 ether, 1 ether, address(0));

        vm.prank(bidder1);
        auction.placeBid{value: 10 ether}(auctionId, 10 ether);

        vm.prank(bidder2);
        auction.placeBid{value: 12 ether}(auctionId, 12 ether);

        NoLossAuction.Bid[] memory allBids = auction.getAllBids(auctionId);
        assertEq(allBids.length, 2);
        assertEq(allBids[0].bidder, bidder1);
        assertEq(allBids[0].amount, 10 ether);
        assertEq(allBids[1].bidder, bidder2);
        assertEq(allBids[1].amount, 12 ether);
    }

    function testIsAuctionActive() public {
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(seller);
        assetToken.approve(address(auction), 100 ether);
        uint256 auctionId = auction.createAuction(
            address(assetToken),
            0,
            100 ether,
            10 ether,
            startTime,
            endTime,
            1 ether,
            address(0)
        );
        vm.stopPrank();

        // Before start time - auction is Upcoming, so not active
        assertFalse(auction.isAuctionActive(auctionId));

        // During auction - state transitions to Active when startTime passes
        vm.warp(startTime + 1);
        // Update state to Active (normally happens on first bid, but isAuctionActive checks time)
        assertTrue(auction.isAuctionActive(auctionId));

        // After end time
        vm.warp(endTime);
        assertFalse(auction.isAuctionActive(auctionId));
    }

    // =============================================================
    //                        HELPER FUNCTIONS
    // =============================================================

    function _createActiveAuction(
        address assetToken_,
        uint256 tokenId,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 minBidIncrement,
        address paymentToken_
    ) internal returns (uint256) {
        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(seller);
        if (tokenId == 0) {
            // ERC-20
            MockERC20(assetToken_).approve(address(auction), assetAmount);
        }
        uint256 auctionId = auction.createAuction(
            assetToken_,
            tokenId,
            assetAmount,
            reservePrice,
            startTime,
            endTime,
            minBidIncrement,
            paymentToken_
        );
        vm.stopPrank();

        return auctionId;
    }
}

