// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/RWAAssetNFT.sol";

contract RWAAssetNFTTest is Test {
    RWAAssetNFT internal nft;

    address internal owner = address(0xA11CE);
    address internal compliance = address(0xBEEF);
    address internal user1 = address(0x1);
    address internal user2 = address(0x2);

    function setUp() public {
        vm.prank(owner);
        nft = new RWAAssetNFT(
            "RWA Assets",
            "RWA-NFT",
            owner,
            true // transferRestrictionsEnabled
        );

        // Configure compliance admin
        vm.prank(owner);
        nft.setComplianceAdmin(compliance);

        // Whitelist participants
        vm.prank(owner);
        nft.setWhitelist(owner, true);

        vm.prank(compliance);
        nft.setWhitelist(user1, true);

        vm.prank(compliance);
        nft.setWhitelist(user2, true);
    }

    function testInitialConfig() public {
        assertEq(nft.balanceOf(owner), 0);
        assertTrue(nft.transferRestrictionsEnabled());
    }

    function testMintAndOwnership() public {
        vm.prank(owner);
        nft.mint(user1, 1);

        assertEq(nft.balanceOf(user1), 1);
        assertEq(nft.ownerOf(1), user1);
    }

    function testEnumerableAndMultiTokenSupport() public {
        vm.startPrank(compliance);
        nft.mint(user1, 1);
        nft.mint(user1, 2);
        nft.mint(user2, 3);
        vm.stopPrank();

        assertEq(nft.balanceOf(user1), 2);
        assertEq(nft.balanceOf(user2), 1);

        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(2), user1);
        assertEq(nft.ownerOf(3), user2);
    }

    function testTransferRestrictionsWhitelist() public {
        vm.prank(compliance);
        nft.mint(user1, 10);

        // Transfer between whitelisted addresses should pass
        vm.prank(user1);
        nft.approve(user2, 10);

        vm.prank(user2);
        nft.transferFrom(user1, user2, 10);
        assertEq(nft.ownerOf(10), user2);

        // Remove user2 from whitelist
        vm.prank(compliance);
        nft.setWhitelist(user2, false);

        vm.prank(user2);
        vm.expectRevert("RWA721: sender not whitelisted");
        nft.transferFrom(user2, user1, 10);
    }

    function testDisableTransferRestrictionsAllowsFreeTransfers() public {
        vm.prank(compliance);
        nft.mint(user1, 11);

        address nonWhitelisted = address(0x999);

        vm.prank(owner);
        nft.setTransferRestrictionsEnabled(false);

        vm.prank(user1);
        nft.approve(nonWhitelisted, 11);

        vm.prank(nonWhitelisted);
        nft.transferFrom(user1, nonWhitelisted, 11);
        assertEq(nft.ownerOf(11), nonWhitelisted);
    }

    function testPauseAndUnpause() public {
        vm.prank(compliance);
        nft.mint(user1, 20);

        vm.prank(owner);
        nft.pause();

        vm.prank(user1);
        vm.expectRevert("RWA721: paused");
        nft.transferFrom(user1, user2, 20);

        vm.prank(compliance);
        nft.unpause();

        vm.prank(user1);
        nft.approve(user2, 20);

        vm.prank(user2);
        nft.transferFrom(user1, user2, 20);

        assertEq(nft.ownerOf(20), user2);
    }

    function testMetadataURI() public {
        vm.startPrank(compliance);
        nft.mint(user1, 30);
        vm.stopPrank();

        vm.prank(owner);
        nft.setBaseTokenURI("ipfs://base/");

        assertEq(nft.tokenURI(30), "ipfs://base/");

        vm.prank(compliance);
        nft.setTokenURI(30, "ipfs://asset/30");

        assertEq(nft.tokenURI(30), "ipfs://asset/30");
    }

    function testRoyaltiesDefaultAndPerToken() public {
        vm.prank(owner);
        nft.setDefaultRoyalty(owner, 500); // 5%

        vm.prank(compliance);
        nft.mint(user1, 40);

        (address receiverDefault, uint256 amountDefault) = nft.royaltyInfo(40, 1 ether);
        assertEq(receiverDefault, owner);
        assertEq(amountDefault, 0.05 ether);

        vm.prank(compliance);
        nft.setTokenRoyalty(40, compliance, 1000); // 10%

        (address receiverToken, uint256 amountToken) = nft.royaltyInfo(40, 1 ether);
        assertEq(receiverToken, compliance);
        assertEq(amountToken, 0.10 ether);

        vm.prank(compliance);
        nft.resetTokenRoyalty(40);

        (address receiverReset, uint256 amountReset) = nft.royaltyInfo(40, 1 ether);
        assertEq(receiverReset, owner);
        assertEq(amountReset, 0.05 ether);
    }

    function testBurnRemovesOwnershipAndMetadata() public {
        vm.startPrank(compliance);
        nft.mint(user1, 50);
        nft.setTokenURI(50, "ipfs://asset/50");
        vm.stopPrank();

        vm.prank(compliance);
        nft.burn(50);

        vm.expectRevert("RWA721: owner query for nonexistent");
        nft.ownerOf(50);

        vm.expectRevert("RWA721: URI query for nonexistent");
        nft.tokenURI(50);
    }
}


