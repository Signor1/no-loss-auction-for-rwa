// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/RWAIdentityRegistry.sol";
import "../src/RWATREXToken.sol";

contract RWATREXTokenTest is Test {
    RWAIdentityRegistry internal registry;
    RWATREXToken internal token;
    address internal admin = address(0xA11CE);
    address internal compliance = address(0xBEEF);
    address internal investor1 = address(0x1);
    address internal investor2 = address(0x2);
    address internal investor3 = address(0x3);

    function setUp() public {
        // Deploy identity registry
        vm.prank(admin);
        registry = new RWAIdentityRegistry(admin);

        vm.prank(admin);
        registry.setComplianceOfficer(compliance);

        // Deploy T-REX token
        vm.prank(admin);
        token = new RWATREXToken(
            "RWA Security Token",
            "RWA-ST",
            18,
            admin,
            address(registry),
            1_000_000 ether
        );

        vm.prank(admin);
        token.setComplianceAdmin(compliance);

        // Register and verify admin (needed for transfers)
        _registerAndVerifyInvestor(admin, "US", true, true, true);

        // Register and verify investors
        _registerAndVerifyInvestor(investor1, "US", true, true, true);
        _registerAndVerifyInvestor(investor2, "US", true, true, false);
        _registerAndVerifyInvestor(investor3, "GB", true, true, true);
    }

    function _registerAndVerifyInvestor(
        address investor,
        string memory country,
        bool kyc,
        bool aml,
        bool accredited
    ) internal {
        bytes32 identityHash = keccak256(abi.encodePacked(investor, country));

        vm.prank(admin);
        registry.registerIdentity(investor, identityHash, country);

        if (kyc || aml) {
            vm.prank(compliance);
            registry.setKYCAMLStatus(investor, kyc, aml);
        }

        if (accredited) {
            vm.prank(compliance);
            registry.setAccreditationStatus(investor, accredited);
        }
    }

    function testInitialConfig() public view {
        assertEq(token.owner(), admin);
        assertEq(token.complianceAdmin(), compliance);
        assertEq(token.totalSupply(), 1_000_000 ether);
        assertEq(token.balanceOf(admin), 1_000_000 ether);
    }

    function testTransferWithCompliantParties() public {
        vm.prank(admin);
        token.transfer(investor1, 100 ether);

        assertEq(token.balanceOf(investor1), 100 ether);
        assertEq(token.balanceOf(admin), 1_000_000 ether - 100 ether);
    }

    function testTransferRevertsWhenKYCNotVerified() public {
        address nonKYC = address(0xBAD);
        bytes32 identityHash = keccak256("non-kyc");

        vm.prank(admin);
        registry.registerIdentity(nonKYC, identityHash, "US");
        // Don't set KYC status

        vm.prank(admin);
        token.transfer(nonKYC, 100 ether); // Mint is allowed

        vm.prank(nonKYC);
        vm.expectRevert(bytes("RWATREX: compliance check failed: KYC verification required"));
        token.transfer(investor1, 50 ether);
    }

    function testTransferRevertsWhenAMLNotVerified() public {
        address nonAML = address(0xBAD2);
        bytes32 identityHash = keccak256("non-aml");

        vm.prank(admin);
        registry.registerIdentity(nonAML, identityHash, "US");

        vm.prank(compliance);
        registry.setKYCStatus(nonAML, true);
        // Don't set AML status

        vm.prank(admin);
        token.transfer(nonAML, 100 ether);

        vm.prank(nonAML);
        vm.expectRevert(bytes("RWATREX: compliance check failed: AML verification required"));
        token.transfer(investor1, 50 ether);
    }

    function testAccreditedOnlyRule() public {
        // Add accredited-only rule
        vm.prank(compliance);
        uint256 ruleId = token.addTransferRule(
            RWATREXToken.RuleType.ACCREDITED_ONLY,
            "Only accredited investors can receive tokens",
            ""
        );

        // investor2 is not accredited
        vm.prank(admin);
        vm.expectRevert("RWATREX: compliance check failed: Recipient must be accredited");
        token.transfer(investor2, 100 ether);

        // investor1 is accredited, should work
        vm.prank(admin);
        token.transfer(investor1, 100 ether);
        assertEq(token.balanceOf(investor1), 100 ether);
    }

    function testCountryRestrictionRule() public {
        // Add country restriction rule
        vm.prank(compliance);
        token.addTransferRule(
            RWATREXToken.RuleType.COUNTRY_RESTRICTED,
            "Restrict certain countries",
            ""
        );

        // Restrict GB
        vm.prank(compliance);
        token.setRestrictedCountry("GB", true);

        // Transfer to GB investor should fail
        vm.prank(admin);
        vm.expectRevert("RWATREX: compliance check failed: Country restriction");
        token.transfer(investor3, 100 ether);

        // Transfer to US investor should work
        vm.prank(admin);
        token.transfer(investor1, 100 ether);
        assertEq(token.balanceOf(investor1), 100 ether);
    }

    function testMinBalanceRule() public {
        // Add minimum balance rule
        vm.prank(compliance);
        token.addTransferRule(
            RWATREXToken.RuleType.MIN_BALANCE,
            "Minimum balance requirement",
            ""
        );

        // Set minimum balance for investor1
        vm.prank(compliance);
        token.setMinBalance(investor1, 200 ether);

        // Transfer less than minimum should fail
        vm.prank(admin);
        vm.expectRevert("RWATREX: compliance check failed: Minimum balance requirement");
        token.transfer(investor1, 100 ether);

        // Transfer enough to meet minimum should work
        vm.prank(admin);
        token.transfer(investor1, 200 ether);
        assertEq(token.balanceOf(investor1), 200 ether);
    }

    function testMaxTransferRule() public {
        // Add maximum transfer rule
        vm.prank(compliance);
        token.addTransferRule(
            RWATREXToken.RuleType.MAX_TRANSFER,
            "Maximum transfer amount",
            ""
        );

        // Set max transfer for admin
        vm.prank(compliance);
        token.setMaxTransferAmount(admin, 500 ether);

        // Transfer within limit should work
        vm.prank(admin);
        token.transfer(investor1, 500 ether);
        assertEq(token.balanceOf(investor1), 500 ether);

        // Transfer exceeding limit should fail
        vm.prank(admin);
        vm.expectRevert("RWATREX: compliance check failed: Maximum transfer exceeded");
        token.transfer(investor2, 600 ether);
    }

    function testDisableTransferRule() public {
        // Get default rule IDs (0 and 1 are KYC and AML)
        uint256[] memory activeRules = token.getActiveRuleIds();
        uint256 kycRuleId = activeRules[0];

        // Disable KYC rule
        vm.prank(compliance);
        token.setTransferRuleEnabled(kycRuleId, false);

        // Now transfer should work even without KYC
        address nonKYC = address(0xBAD);
        bytes32 identityHash = keccak256("non-kyc");

        vm.prank(admin);
        registry.registerIdentity(nonKYC, identityHash, "US");
        // Don't set KYC

        vm.prank(admin);
        token.transfer(nonKYC, 100 ether);

        vm.prank(nonKYC);
        // Should still fail on AML check (KYC rule is disabled, but AML rule is still active)
        vm.expectRevert(bytes("RWATREX: compliance check failed: AML verification required"));
        token.transfer(investor1, 50 ether);
    }

    function testCheckCompliance() public view {
        (bool compliant, string memory reason) = token.checkCompliance(admin, investor1, 100 ether);
        assertTrue(compliant);
        assertEq(bytes(reason).length, 0);
    }

    function testCheckComplianceFails() public view {
        address nonKYC = address(0xBAD);
        (bool compliant, string memory reason) = token.checkCompliance(admin, nonKYC, 100 ether);
        assertFalse(compliant);
        assertGt(bytes(reason).length, 0);
    }

    function testPauseAndUnpause() public {
        vm.prank(compliance);
        token.pause();

        vm.prank(admin);
        vm.expectRevert("RWATREX: paused");
        token.transfer(investor1, 100 ether);

        vm.prank(admin);
        token.unpause();

        vm.prank(admin);
        token.transfer(investor1, 100 ether);
        assertEq(token.balanceOf(investor1), 100 ether);
    }

    function testMintAndBurn() public {
        vm.prank(compliance);
        token.mint(investor1, 500 ether);

        assertEq(token.balanceOf(investor1), 500 ether);
        assertEq(token.totalSupply(), 1_000_500 ether);

        vm.prank(investor1);
        token.burn(100 ether);

        assertEq(token.balanceOf(investor1), 400 ether);
        assertEq(token.totalSupply(), 1_000_400 ether);
    }

    function testGetTransferRule() public view {
        uint256[] memory activeRules = token.getActiveRuleIds();
        assertGt(activeRules.length, 0);

        RWATREXToken.TransferRule memory rule = token.getTransferRule(activeRules[0]);
        assertEq(rule.ruleId, activeRules[0]);
        assertTrue(rule.enabled);
    }

    function testMultipleRulesEnforcement() public {
        // Add multiple rules
        vm.prank(compliance);
        token.addTransferRule(
            RWATREXToken.RuleType.ACCREDITED_ONLY,
            "Accredited only",
            ""
        );

        vm.prank(compliance);
        token.setRestrictedCountry("GB", true);
        vm.prank(compliance);
        token.addTransferRule(
            RWATREXToken.RuleType.COUNTRY_RESTRICTED,
            "Country restriction",
            ""
        );

        // investor3 is in GB and accredited, but GB is restricted
        vm.prank(admin);
        vm.expectRevert("RWATREX: compliance check failed: Country restriction");
        token.transfer(investor3, 100 ether);

        // investor1 is in US and accredited, should work
        vm.prank(admin);
        token.transfer(investor1, 100 ether);
        assertEq(token.balanceOf(investor1), 100 ether);
    }
}

