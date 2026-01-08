// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/NoLossAuction.sol";
import "../src/AuctionFactory.sol";
import "../src/RWAAssetNFT.sol";

contract AccessControlTest is Test {
    NoLossAuction public auction;
    AuctionFactory public factory;
    RWAAssetNFT public nft;
    
    address public owner;
    address public feeReceiver;
    address public user1;
    address public user2;
    uint256 public auctionId;

    // Allow test contract to receive ETH
    receive() external payable {}

    function setUp() public {
        owner = address(this);
        feeReceiver = makeAddr("feeReceiver");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts
        nft = new RWAAssetNFT("RWA NFT", "RWANFT", owner, false);
        auction = new NoLossAuction(owner);
        factory = new AuctionFactory(address(auction), feeReceiver, 0.01 ether);

        // Setup auction
        nft.mint(user1, 1);
        
        vm.startPrank(user1);
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

    // =============================================================
    //                    GLOBAL PAUSE TESTS
    // =============================================================

    function testGlobalPauseBlocksAuctionCreation() public {
        // Pause globally
        auction.pauseGlobal();
        assertTrue(auction.globallyPaused(), "Should be globally paused");

        // Try to create auction - should fail
        nft.mint(user2, 2);
        vm.startPrank(user2);
        nft.approve(address(auction), 2);
        
        vm.expectRevert("NoLossAuction: globally paused");
        auction.createAuction(
            address(nft),
            2,
            1,
            0.1 ether,
            block.timestamp,
            block.timestamp + 1 days,
            0.01 ether,
            address(0),
            0,
            0,
            false,
            0,
            false
        );
        vm.stopPrank();
    }

    function testGlobalPauseBlocksBidding() public {
        // Pause globally
        auction.pauseGlobal();

        // Try to place bid - should fail
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        vm.expectRevert("NoLossAuction: globally paused");
        auction.placeBid{value: 1 ether}(auctionId, 1 ether);
    }

    function testGlobalPauseAllowsRefunds() public {
        // Place a bid first
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        auction.placeBid{value: 1 ether}(auctionId, 1 ether);

        // Place higher bid from another user
        address user3 = makeAddr("user3");
        vm.deal(user3, 10 ether);
        vm.prank(user3);
        auction.placeBid{value: 2 ether}(auctionId, 2 ether);

        // Move past auction end and end auction BEFORE pausing
        vm.warp(block.timestamp + 2 days);
        auction.endAuction(auctionId);

        // Now pause globally
        auction.pauseGlobal();

        // Refunds should still work (safety mechanism)
        uint256 balanceBefore = user2.balance;
        auction.refundBidder(auctionId, user2);
        assertEq(user2.balance, balanceBefore + 1 ether, "Refund should work during pause");
    }

    function testOnlyOwnerCanGlobalPause() public {
        vm.prank(user1);
        vm.expectRevert("NoLossAuction: caller is not owner");
        auction.pauseGlobal();
    }

    function testGlobalUnpause() public {
        // Pause
        auction.pauseGlobal();
        assertTrue(auction.globallyPaused());

        // Unpause
        auction.unpauseGlobal();
        assertFalse(auction.globallyPaused());

        // Should be able to bid again
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        auction.placeBid{value: 1 ether}(auctionId, 1 ether);
    }

    // =============================================================
    //                    FACTORY PAUSE TESTS
    // =============================================================

    function testFactoryPauseBlocksAuctionCreation() public {
        // Pause factory
        factory.pause();
        assertTrue(factory.paused(), "Factory should be paused");

        // Try to create auction via factory - should fail
        nft.mint(user2, 2);
        vm.deal(user2, 1 ether);
        vm.startPrank(user2);
        nft.approve(address(factory), 2);
        
        vm.expectRevert("AuctionFactory: paused");
        factory.createAuction{value: 0.01 ether}(
            0, // template ID
            address(nft),
            2,
            1,
            0.1 ether,
            block.timestamp,
            block.timestamp + 1 days,
            address(0)
        );
        vm.stopPrank();
    }

    function testFactoryUnpause() public {
        // Pause
        factory.pause();
        assertTrue(factory.paused());

        // Unpause
        factory.unpause();
        assertFalse(factory.paused());

        // Should be able to create auction
        nft.mint(user2, 2);
        vm.deal(user2, 1 ether);
        vm.startPrank(user2);
        nft.approve(address(factory), 2);
        
        factory.createAuction{value: 0.01 ether}(
            0,
            address(nft),
            2,
            1,
            0.1 ether,
            block.timestamp,
            block.timestamp + 1 days,
            address(0)
        );
        vm.stopPrank();
    }

    function testOnlyOwnerCanPauseFactory() public {
        vm.prank(user1);
        vm.expectRevert("AuctionFactory: not owner");
        factory.pause();
    }

    // =============================================================
    //                    PER-AUCTION PAUSE TESTS
    // =============================================================

    function testPerAuctionPauseBlocksBidding() public {
        // Pause specific auction
        auction.pauseAuction(auctionId);

        // Try to bid - should fail
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        vm.expectRevert("NoLossAuction: auction is paused");
        auction.placeBid{value: 1 ether}(auctionId, 1 ether);
    }

    function testPerAuctionUnpause() public {
        // Pause
        auction.pauseAuction(auctionId);

        // Unpause
        auction.unpauseAuction(auctionId);

        // Should be able to bid
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        auction.placeBid{value: 1 ether}(auctionId, 1 ether);
    }
}
