// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/RWAFractionalToken.sol";

contract RWAFractionalTokenTest is Test {
    RWAFractionalToken internal token;
    address internal owner = address(0xA11CE);
    address internal compliance = address(0xBEEF);
    address internal user1 = address(0x1);
    address internal user2 = address(0x2);

    function setUp() public {
        vm.prank(owner);
        token = new RWAFractionalToken(
            "RWA Fractional",
            "RWA-F",
            18,
            owner,
            1_000 ether,
            true // transferRestrictionsEnabled
        );

        // Set an explicit compliance admin
        vm.prank(owner);
        token.setComplianceAdmin(compliance);

        // Whitelist owner and users
        vm.prank(owner);
        token.setWhitelist(owner, true);

        vm.prank(compliance);
        token.setWhitelist(user1, true);

        vm.prank(compliance);
        token.setWhitelist(user2, true);
    }

    function testInitialState() public {
        assertEq(token.totalSupply(), 1_000 ether);
        assertEq(token.balanceOf(owner), 1_000 ether);
        assertTrue(token.transferRestrictionsEnabled());
    }

    function testTransferBetweenWhitelistedAddresses() public {
        vm.prank(owner);
        token.transfer(user1, 100 ether);

        assertEq(token.balanceOf(owner), 900 ether);
        assertEq(token.balanceOf(user1), 100 ether);
    }

    function testTransferRevertsWhenRecipientNotWhitelisted() public {
        address badUser = address(0xBAD);

        vm.prank(owner);
        token.setWhitelist(badUser, false);

        vm.prank(owner);
        vm.expectRevert("RWA: recipient not whitelisted");
        token.transfer(badUser, 1 ether);
    }

    function testPauseAndUnpause() public {
        vm.prank(compliance);
        token.pause();

        vm.prank(owner);
        vm.expectRevert("RWA: paused");
        token.transfer(user1, 1 ether);

        vm.prank(owner);
        token.unpause();

        vm.prank(owner);
        token.transfer(user1, 1 ether);
        assertEq(token.balanceOf(user1), 1 ether);
    }

    function testMintByOwnerOrCompliance() public {
        vm.prank(compliance);
        token.mint(user1, 50 ether);
        assertEq(token.balanceOf(user1), 50 ether);

        vm.prank(owner);
        token.mint(user2, 25 ether);
        assertEq(token.balanceOf(user2), 25 ether);
    }

    function testBurnAndBurnFrom() public {
        vm.prank(owner);
        token.transfer(user1, 100 ether);

        // user1 burns directly
        vm.prank(user1);
        token.burn(40 ether);
        assertEq(token.balanceOf(user1), 60 ether);

        // owner approves user2 to burn on their behalf
        vm.prank(user1);
        token.approve(user2, 20 ether);

        vm.prank(user2);
        token.burnFrom(user1, 20 ether);
        assertEq(token.balanceOf(user1), 40 ether);
    }

    function testDisableTransferRestrictionsAllowsFreeTransfers() public {
        vm.prank(owner);
        token.setTransferRestrictionsEnabled(false);

        address nonWhitelisted = address(0x1234);

        vm.prank(owner);
        token.transfer(nonWhitelisted, 10 ether);
        assertEq(token.balanceOf(nonWhitelisted), 10 ether);
    }

    function testSnapshotsTrackBalancesAndTotalSupply() public {
        // Initial snapshot
        vm.prank(owner);
        uint256 snap1 = token.snapshot();

        assertEq(token.balanceOfAt(owner, snap1), 1_000 ether);
        assertEq(token.totalSupplyAt(snap1), 1_000 ether);

        // Transfer and mint, then snapshot again
        vm.prank(owner);
        token.transfer(user1, 100 ether);

        vm.prank(compliance);
        token.mint(user2, 50 ether);

        vm.prank(owner);
        uint256 snap2 = token.snapshot();

        assertEq(token.balanceOfAt(owner, snap2), 900 ether);
        assertEq(token.balanceOfAt(user1, snap2), 100 ether);
        assertEq(token.balanceOfAt(user2, snap2), 50 ether);
        assertEq(token.totalSupplyAt(snap2), 1_050 ether);
    }
}


