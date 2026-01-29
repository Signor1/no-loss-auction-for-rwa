// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/RWAIdentityRegistry.sol";

contract RWAIdentityRegistryTest is Test {
    RWAIdentityRegistry internal registry;
    address internal admin = address(0xA11CE);
    address internal compliance = address(0xBEEF);
    address internal investor1 = address(0x1);
    address internal investor2 = address(0x2);

    function setUp() public {
        vm.prank(admin);
        registry = new RWAIdentityRegistry(admin);

        vm.prank(admin);
        registry.setComplianceOfficer(compliance);
    }

    function testInitialConfig() public view {
        assertEq(registry.registryAdmin(), admin);
        assertEq(registry.complianceOfficer(), compliance);
    }

    function testRegisterIdentity() public {
        bytes32 identityHash = keccak256("identity-doc-1");
        string memory country = "US";

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, country);

        assertTrue(registry.isRegistered(investor1));
        RWAIdentityRegistry.Identity memory identity = registry.getIdentity(investor1);
        assertEq(identity.identityHash, identityHash);
        assertEq(identity.country, country);
        assertFalse(identity.kycVerified);
        assertFalse(identity.amlVerified);
        assertFalse(identity.accredited);
    }

    function testUpdateIdentity() public {
        bytes32 initialHash = keccak256("identity-doc-1");
        bytes32 newHash = keccak256("identity-doc-2");

        vm.prank(admin);
        registry.registerIdentity(investor1, initialHash, "US");

        vm.prank(compliance);
        registry.updateIdentity(investor1, newHash);

        RWAIdentityRegistry.Identity memory identity = registry.getIdentity(investor1);
        assertEq(identity.identityHash, newHash);
    }

    function testSetKYCStatus() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        registry.setKYCStatus(investor1, true);

        assertTrue(registry.isKYCVerified(investor1));
    }

    function testSetAMLStatus() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        registry.setAMLStatus(investor1, true);

        assertTrue(registry.isAMLVerified(investor1));
    }

    function testSetKYCAMLStatus() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        registry.setKYCAMLStatus(investor1, true, true);

        assertTrue(registry.isKYCVerified(investor1));
        assertTrue(registry.isAMLVerified(investor1));
    }

    function testSetAccreditationStatus() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        registry.setAccreditationStatus(investor1, true);

        assertTrue(registry.isAccredited(investor1));
    }

    function testSetCountry() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        registry.setCountry(investor1, "GB");

        assertEq(registry.getCountry(investor1), "GB");
    }

    function testIsCompliant() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        assertFalse(registry.isCompliant(investor1));

        vm.prank(compliance);
        registry.setKYCAMLStatus(investor1, true, true);

        assertTrue(registry.isCompliant(investor1));
    }

    function testSetComplianceData() public {
        bytes32 identityHash = keccak256("identity-doc-1");
        bytes32 key = keccak256("risk-score");
        bytes32 value = bytes32(uint256(75));

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        registry.setComplianceData(investor1, key, value);

        assertEq(registry.getComplianceData(investor1, key), value);
    }

    function testRemoveIdentity() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(admin);
        registry.removeIdentity(investor1);

        assertFalse(registry.isRegistered(investor1));
    }

    function testGetRegisteredInvestorCount() public {
        bytes32 identityHash1 = keccak256("identity-doc-1");
        bytes32 identityHash2 = keccak256("identity-doc-2");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash1, "US");

        vm.prank(compliance);
        registry.registerIdentity(investor2, identityHash2, "GB");

        assertEq(registry.getRegisteredInvestorCount(), 2);
    }

    function testOnlyAdminCanRemoveIdentity() public {
        bytes32 identityHash = keccak256("identity-doc-1");

        vm.prank(admin);
        registry.registerIdentity(investor1, identityHash, "US");

        vm.prank(compliance);
        vm.expectRevert("RWAIR: caller is not admin");
        registry.removeIdentity(investor1);
    }
}

