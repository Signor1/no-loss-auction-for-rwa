// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/AccessControlRegistry.sol";
import "../src/Timelock.sol";
import "../src/MultiSigWallet.sol";

contract GovernanceTest is Test {
    AccessControlRegistry internal registry;
    Timelock internal timelock;
    MultiSigWallet internal multisig;

    address internal myAdmin;
    address internal manager;
    address internal myUser;
    
    address internal owner1;
    address internal owner2;
    address internal owner3;

    function setUp() public {
        myAdmin = makeAddr("admin");
        manager = makeAddr("manager");
        myUser = makeAddr("user");
        owner1 = makeAddr("owner1");
        owner2 = makeAddr("owner2");
        owner3 = makeAddr("owner3");

        vm.startPrank(myAdmin);
        
        // 1. Setup RBAC
        registry = new AccessControlRegistry(myAdmin);
        
        // 2. Setup Timelock
        timelock = new Timelock(myAdmin);
        
        // 3. Setup MultiSig
        address[] memory owners = new address[](3);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;
        multisig = new MultiSigWallet(owners, 2);
        
        vm.stopPrank();
    }

    function testRBAC_GrantRevoke() public {
        console.log("Testing GrantRevoke...");
        console.log("Admin is:", myAdmin);
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), myAdmin), "Admin should have role");
        
        vm.startPrank(myAdmin);
        registry.grantRole(registry.ASSET_MANAGER_ROLE(), manager);
        assertTrue(registry.hasRole(registry.ASSET_MANAGER_ROLE(), manager));
        
        registry.revokeRole(registry.ASSET_MANAGER_ROLE(), manager);
        assertFalse(registry.hasRole(registry.ASSET_MANAGER_ROLE(), manager));
        vm.stopPrank();
    }

    function testRBAC_Unauthorized() public {
        console.log("Testing Unauthorized...");
        assertFalse(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), myUser), "User should NOT have role");
        
        vm.startPrank(myUser);
        vm.expectRevert();
        registry.grantRole(registry.ASSET_MANAGER_ROLE(), manager);
        vm.stopPrank();
    }

    // Allow contract to receive calls
    fallback() external payable {}
    receive() external payable {}

    function testTimelock() public {
        vm.startPrank(myAdmin);
        
        uint256 eta = block.timestamp + 2 days;
        bytes memory data = "";
        
        // Queue
        bytes32 id = timelock.queueTransaction(address(this), 0, data, eta);
        assertTrue(timelock.queuedTransactions(id));
        
        // Try execute too early
        vm.expectRevert("Timelock: transaction not ready");
        timelock.executeTransaction(address(this), 0, data, eta);
        
        // Warp time
        vm.warp(eta + 1);
        
        // Execute
        timelock.executeTransaction(address(this), 0, data, eta);
        assertFalse(timelock.queuedTransactions(id));
        
        vm.stopPrank();
    }

    function testMultiSigExecution() public {
        // Owner 1 submits
        vm.prank(owner1);
        multisig.submitTransaction(address(this), 0, "");
        
        uint256 txIndex = 0;
        
        // Owner 1 confirms
        vm.prank(owner1);
        multisig.confirmTransaction(txIndex);
        
        // Owner 2 confirms
        vm.prank(owner2);
        multisig.confirmTransaction(txIndex);
        
        // Execute (by owner 1)
        vm.prank(owner1);
        multisig.executeTransaction(txIndex);
        
        (,,, bool executed,) = multisig.getTransaction(txIndex);
        assertTrue(executed);
    }

    function testMultiSigRevoke() public {
        vm.prank(owner1);
        multisig.submitTransaction(address(this), 0, "");
        
        vm.prank(owner1);
        multisig.confirmTransaction(0);
        
        (,,,, uint256 confirmations) = multisig.getTransaction(0);
        assertEq(confirmations, 1);
        
        vm.prank(owner1);
        multisig.revokeConfirmation(0);
        
        (,,,, confirmations) = multisig.getTransaction(0);
        assertEq(confirmations, 0);
    }
}
