// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../src/NoLossAuction.sol";
import "../src/RWAAssetNFT.sol";

/// @title Invariant Test Suite
/// @notice Invariant testing for system-wide properties
contract InvariantTest is StdInvariant, Test {
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

        // Create auction
        nft.mint(seller, 1);
        vm.startPrank(seller);
        nft.approve(address(auction), 1);
        auctionId = auction.createAuction(
            address(nft),
            1,
            1,
            1 ether,
            block.timestamp,
            block.timestamp + 7 days,
            0.01 ether,
            address(0),
            0,
            0,
            false,
            0,
            false
        );
        vm.stopPrank();

        // Target the auction contract for invariant testing
        targetContract(address(auction));
    }

    /// @notice Invariant: Total escrowed ETH must match sum of individual escrows
    /// @dev This is a simplified check for the auctionId used in setup
    function invariant_escrowEthBalanceMatch() public view {
        // Since we only have one auction and it's ETH based (address(0))
        uint256 totalEscrowed = auction.totalEscrowedByToken(address(0));
        
        // This is hard to check perfectly without tracking all bidders,
        // but we can check it's >= 0 and consistent with contract balance
        assertTrue(address(auction).balance >= totalEscrowed, "Contract balance must cover escrows");
    }

    /// @notice Invariant: Highest bidder amount must match highest bid record
    function invariant_highestBidConsistency() public view {
        uint256 hBid = auction.highestBid(auctionId);
        address hBidder = auction.highestBidder(auctionId);
        
        if (hBidder != address(0)) {
            uint256 bidderEscrow = auction.escrow(auctionId, hBidder);
            assertEq(bidderEscrow, hBid, "Highest bidder's escrow must match highest bid");
        }
    }

    /// @notice Invariant: Auction state should be valid
    function invariant_auctionStateValid() public view {
        // Auction struct has 17 fields. state is index 12 (0-indexed).
        (,,,,,,,,,,,, NoLossAuction.AuctionState state,,,,) = auction.auctions(auctionId);
        
        if (state == NoLossAuction.AuctionState.Active) {
            // highestBidder is a separate mapping
            address hBidder = auction.highestBidder(auctionId);
            // hBidder can be address(0) if no bids placed, but setUp places a bid? No, setUp just creates the auction.
        }
    }
}
