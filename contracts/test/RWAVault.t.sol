// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/RWAVault.sol";
import "./MockERC20.sol";

contract RWAVaultTest is Test {
    MockERC20 internal asset;
    RWAVault internal vault;
    address internal owner = address(0xA11CE);
    address internal manager = address(0xBEEF);
    address internal feeRecipient = address(0xFEE);
    address internal user1 = address(0x1);
    address internal user2 = address(0x2);

    function setUp() public {
        // Deploy mock ERC-20 asset
        asset = new MockERC20("Test Asset", "TST", 18);

        // Deploy vault
        vm.prank(owner);
        vault = new RWAVault(
            address(asset),
            "RWA Vault",
            "RWA-V",
            owner,
            manager,
            feeRecipient,
            200, // 2% management fee
            2000 // 20% performance fee
        );

        // Mint assets to users
        asset.mint(user1, 10_000 ether);
        asset.mint(user2, 10_000 ether);
        asset.mint(owner, 10_000 ether);
    }

    function testInitialConfig() public view {
        assertEq(vault.asset(), address(asset));
        assertEq(vault.owner(), owner);
        assertEq(vault.feeRecipient(), feeRecipient);
        assertEq(vault.managementFeeBps(), 200);
        assertEq(vault.performanceFeeBps(), 2000);
        assertEq(vault.totalAssets(), 0);
        assertEq(vault.totalSupply(), 0);
    }

    function testDeposit() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user1);
        vm.stopPrank();

        assertEq(vault.balanceOf(user1), shares);
        assertEq(vault.totalAssets(), depositAmount);
        assertEq(vault.totalSupply(), shares);
        assertEq(asset.balanceOf(address(vault)), depositAmount);
    }

    function testMint() public {
        uint256 shares = 1000 ether;

        vm.startPrank(user1);
        asset.approve(address(vault), type(uint256).max);
        uint256 assets = vault.mint(shares, user1);
        vm.stopPrank();

        assertEq(vault.balanceOf(user1), shares);
        assertEq(vault.totalAssets(), assets);
        assertEq(vault.totalSupply(), shares);
    }

    function testWithdraw() public {
        uint256 depositAmount = 1000 ether;

        // Deposit first
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Withdraw
        uint256 withdrawAmount = 500 ether;
        vm.startPrank(user1);
        uint256 sharesBurned = vault.withdraw(withdrawAmount, user1, user1);
        vm.stopPrank();

        assertEq(asset.balanceOf(user1), 10_000 ether - depositAmount + withdrawAmount);
        assertEq(vault.balanceOf(user1), vault.totalSupply());
        assertEq(vault.totalAssets(), depositAmount - withdrawAmount);
    }

    function testRedeem() public {
        uint256 depositAmount = 1000 ether;

        // Deposit first
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Redeem half
        uint256 redeemShares = shares / 2;
        vm.startPrank(user1);
        uint256 assetsReturned = vault.redeem(redeemShares, user1, user1);
        vm.stopPrank();

        assertEq(asset.balanceOf(user1), 10_000 ether - depositAmount + assetsReturned);
        assertEq(vault.balanceOf(user1), shares - redeemShares);
    }

    function testConvertToShares() public {
        uint256 depositAmount = 1000 ether;

        // First deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Convert assets to shares
        uint256 assets = 500 ether;
        uint256 shares = vault.convertToShares(assets);
        assertGt(shares, 0);
    }

    function testConvertToAssets() public {
        uint256 depositAmount = 1000 ether;

        // First deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Convert shares to assets
        uint256 assets = vault.convertToAssets(shares);
        assertEq(assets, depositAmount);
    }

    function testMultipleDeposits() public {
        uint256 deposit1 = 1000 ether;
        uint256 deposit2 = 2000 ether;

        // User1 deposits
        vm.startPrank(user1);
        asset.approve(address(vault), deposit1);
        vault.deposit(deposit1, user1);
        vm.stopPrank();

        // User2 deposits
        vm.startPrank(user2);
        asset.approve(address(vault), deposit2);
        vault.deposit(deposit2, user2);
        vm.stopPrank();

        assertEq(vault.totalAssets(), deposit1 + deposit2);
        assertGt(vault.balanceOf(user1), 0);
        assertGt(vault.balanceOf(user2), 0);
    }

    function testManagementFee() public {
        uint256 depositAmount = 10_000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Fast forward time (30 days)
        vm.warp(block.timestamp + 30 days);

        // Collect fees
        vm.prank(manager);
        vault.collectFees();

        // Check that fees were collected (2% annual = ~0.164% for 30 days)
        uint256 expectedFee = (depositAmount * 200 * 30 days) / (10_000 * 365 days);
        assertEq(asset.balanceOf(feeRecipient), expectedFee);
        assertLt(vault.totalAssets(), depositAmount);
    }

    function testPerformanceFee() public {
        uint256 depositAmount = 10_000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Simulate asset growth (e.g., from external investment)
        vm.prank(owner);
        vault.updateTotalAssets(12_000 ether); // 20% gain

        // Collect fees
        vm.prank(manager);
        vault.collectFees();

        // Performance fee should be 20% of the 2000 ether gain = 400 ether
        uint256 expectedPerformanceFee = (2000 ether * 2000) / 10_000; // 20% of gain
        assertGe(asset.balanceOf(feeRecipient), expectedPerformanceFee);
    }

    function testHighWaterMark() public {
        uint256 depositAmount = 10_000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Initial high water mark should equal total assets
        assertEq(vault.highWaterMark(), depositAmount);

        // Increase assets (HWM not updated until fees are collected)
        vm.prank(owner);
        vault.updateTotalAssets(12_000 ether);
        assertEq(vault.highWaterMark(), depositAmount); // HWM not updated yet

        // Collect fees (this will update HWM)
        // Performance fee: 20% of 2000 ether gain = 400 ether
        vm.prank(manager);
        vault.collectFees();
        // HWM is set to assets after fees are deducted (performance fee: 20% of 2000 = 400)
        uint256 performanceFee = (2000 ether * 2000) / 10_000; // 400 ether
        uint256 assetsAfterFees = 12_000 ether - performanceFee; // 11,600 ether
        assertEq(vault.highWaterMark(), assetsAfterFees); // HWM updated after fee collection

        // Decrease assets (HWM should not decrease)
        vm.prank(owner);
        vault.updateTotalAssets(11_000 ether);
        assertEq(vault.highWaterMark(), assetsAfterFees); // Still at previous high (11,600)
    }

    function testPreviewFunctions() public {
        uint256 depositAmount = 1000 ether;

        // First deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Test preview functions
        uint256 assets = 500 ether;
        uint256 previewShares = vault.previewDeposit(assets);
        assertGt(previewShares, 0);

        uint256 shares = 500 ether;
        uint256 previewAssets = vault.previewMint(shares);
        assertGt(previewAssets, 0);

        uint256 withdrawAssets = 300 ether;
        uint256 previewWithdrawShares = vault.previewWithdraw(withdrawAssets);
        assertGt(previewWithdrawShares, 0);

        uint256 redeemShares = 200 ether;
        uint256 previewRedeemAssets = vault.previewRedeem(redeemShares);
        assertGt(previewRedeemAssets, 0);
    }

    function testMaxFunctions() public {
        uint256 depositAmount = 1000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        assertEq(vault.maxDeposit(user1), type(uint256).max);
        assertEq(vault.maxMint(user1), type(uint256).max);
        assertEq(vault.maxWithdraw(user1), vault.convertToAssets(vault.balanceOf(user1)));
        assertEq(vault.maxRedeem(user1), vault.balanceOf(user1));
    }

    function testUpdateFees() public {
        vm.prank(owner);
        vault.setManagementFee(300); // 3%

        vm.prank(owner);
        vault.setPerformanceFee(2500); // 25%

        assertEq(vault.managementFeeBps(), 300);
        assertEq(vault.performanceFeeBps(), 2500);
    }

    function testUpdateFeeRecipient() public {
        address newRecipient = address(0x1234);

        vm.prank(owner);
        vault.setFeeRecipient(newRecipient);

        assertEq(vault.feeRecipient(), newRecipient);
    }

    function testAddAssets() public {
        uint256 addAmount = 1000 ether;

        vm.startPrank(owner);
        asset.approve(address(vault), addAmount);
        vault.addAssets(addAmount);
        vm.stopPrank();

        assertEq(vault.totalAssets(), addAmount);
        assertEq(asset.balanceOf(address(vault)), addAmount);
    }

    function testTransferShares() public {
        uint256 depositAmount = 1000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        uint256 shares = vault.balanceOf(user1);
        uint256 transferAmount = shares / 2;

        // Transfer shares
        vm.prank(user1);
        vault.transfer(user2, transferAmount);

        assertEq(vault.balanceOf(user1), shares - transferAmount);
        assertEq(vault.balanceOf(user2), transferAmount);
    }

    function testApproveAndTransferFrom() public {
        uint256 depositAmount = 1000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        uint256 shares = vault.balanceOf(user1);
        uint256 transferAmount = shares / 2;

        // Approve and transferFrom
        vm.prank(user1);
        vault.approve(user2, transferAmount);

        vm.prank(user2);
        vault.transferFrom(user1, user2, transferAmount);

        assertEq(vault.balanceOf(user2), transferAmount);
    }

    function testWithdrawWithAllowance() public {
        uint256 depositAmount = 1000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        uint256 shares = vault.balanceOf(user1);
        uint256 withdrawAmount = 500 ether;

        // Approve user2 to withdraw on behalf of user1
        vm.prank(user1);
        vault.approve(user2, shares);

        // User2 withdraws for user1
        vm.prank(user2);
        vault.withdraw(withdrawAmount, user1, user1);

        assertEq(asset.balanceOf(user1), 10_000 ether - depositAmount + withdrawAmount);
    }

    function testRedeemWithAllowance() public {
        uint256 depositAmount = 1000 ether;

        // Deposit
        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user1);
        vm.stopPrank();

        uint256 redeemShares = shares / 2;

        // Approve user2 to redeem on behalf of user1
        vm.prank(user1);
        vault.approve(user2, shares);

        // User2 redeems for user1
        vm.prank(user2);
        vault.redeem(redeemShares, user1, user1);

        assertLt(vault.balanceOf(user1), shares);
    }

    function testFirstDepositSharesEqualAssets() public {
        uint256 depositAmount = 1000 ether;

        vm.startPrank(user1);
        asset.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // First deposit: shares should equal assets (1:1)
        assertEq(shares, depositAmount);
    }

    function testProportionalSharesAfterMultipleDeposits() public {
        uint256 deposit1 = 1000 ether;
        uint256 deposit2 = 2000 ether;

        // First deposit
        vm.startPrank(user1);
        asset.approve(address(vault), deposit1);
        uint256 shares1 = vault.deposit(deposit1, user1);
        vm.stopPrank();

        // Second deposit
        vm.startPrank(user2);
        asset.approve(address(vault), deposit2);
        uint256 shares2 = vault.deposit(deposit2, user2);
        vm.stopPrank();

        // Shares should be proportional to deposits
        // shares2 should be approximately 2x shares1
        assertApproxEqRel(shares2, shares1 * 2, 1e15); // 0.1% tolerance
    }
}

