// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/AssetRegistry.sol";
import "../src/RWAAssetNFT.sol";

contract AssetRegistryTest is Test {
    AssetRegistry internal registry;
    RWAAssetNFT internal nft;

    address internal admin = address(0xA11CE);
    address internal verifier1 = address(0xB0B);
    address internal verifier2 = address(0xCA55);
    address internal issuer = address(0xF00);
    address internal unauthorized = address(0xBAD);

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy NFT (with restrictions enabled)
        nft = new RWAAssetNFT("Real World Asset", "RWA", admin, true);
        
        // Deploy Registry with 2 approvals required
        address[] memory verifiers = new address[](2);
        verifiers[0] = verifier1;
        verifiers[1] = verifier2;
        
        registry = new AssetRegistry(address(nft), verifiers, 2);
        
        // Grant COMPLIANCE/OWNER role to Registry so it can mint
        // Note: RWAAssetNFT uses ownerOrCompliance for minting
        nft.setComplianceAdmin(address(registry));
        
        vm.stopPrank();
    }

    function testInitialSetup() public {
        assertEq(registry.admin(), admin);
        assertEq(address(registry.assetNFT()), address(nft));
        assertEq(registry.requiredApprovals(), 2);
        assertTrue(registry.isVerifier(verifier1));
        assertTrue(registry.isVerifier(verifier2));
    }

    function testRegisterAsset() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        (
            uint256 id,
            address assetIssuer,
            string memory ipfsHash,
            uint256 value,
            AssetRegistry.AssetStatus status,
            uint256 approvalCount,
            uint256 nftId
        ) = registry.assets(assetId);

        assertEq(id, assetId);
        assertEq(assetIssuer, issuer);
        assertEq(ipfsHash, "QmHash123");
        assertEq(value, 1000 ether);
        assertEq(uint256(status), uint256(AssetRegistry.AssetStatus.Pending));
        assertEq(approvalCount, 0);
        assertEq(nftId, 0);
    }

    function testApproveAsset() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        // Verifier 1 approves
        vm.prank(verifier1);
        registry.approveAsset(assetId);

        (,,,,, uint256 count,) = registry.assets(assetId);
        assertEq(count, 1);
        assertTrue(registry.hasApproved(assetId, verifier1));

        // Verifier 2 approves
        vm.prank(verifier2);
        registry.approveAsset(assetId);

        (,,,,, count,) = registry.assets(assetId);
        assertEq(count, 2);
    }

    function testDoubleApproveReverts() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        vm.startPrank(verifier1);
        registry.approveAsset(assetId);
        
        vm.expectRevert("AssetRegistry: already approved");
        registry.approveAsset(assetId);
        vm.stopPrank();
    }

    function testUnauthorizedApproveReverts() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        vm.prank(unauthorized);
        vm.expectRevert("AssetRegistry: not verifier");
        registry.approveAsset(assetId);
    }

    function testFinalizeAsset() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        // Approve by both verifiers
        vm.prank(verifier1);
        registry.approveAsset(assetId);
        vm.prank(verifier2);
        registry.approveAsset(assetId);

        // Finalize
        registry.finalizeAsset(assetId);

        (,,,, AssetRegistry.AssetStatus status,, uint256 nftId) = registry.assets(assetId);
        
        assertEq(uint256(status), uint256(AssetRegistry.AssetStatus.Approved));
        assertEq(nftId, assetId);
        
        // Check NFT minted
        assertEq(nft.ownerOf(nftId), issuer);
        assertEq(nft.tokenURI(nftId), "QmHash123");
    }

    function testFinalizeWithoutApprovalsReverts() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        vm.expectRevert("AssetRegistry: insufficient approvals");
        registry.finalizeAsset(assetId);
    }

    function testRejectAsset() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        vm.prank(verifier1);
        registry.rejectAsset(assetId, "Invalid documents");

        (,,,, AssetRegistry.AssetStatus status,,) = registry.assets(assetId);
        assertEq(uint256(status), uint256(AssetRegistry.AssetStatus.Rejected));

        // Cannot approve rejected asset
        vm.prank(verifier2);
        vm.expectRevert("AssetRegistry: not pending");
        registry.approveAsset(assetId);
    }

    function testAdminFunctions() public {
        vm.startPrank(admin);
        
        // Add verifier
        registry.addVerifier(unauthorized);
        assertTrue(registry.isVerifier(unauthorized));
        
        // Remove verifier
        registry.removeVerifier(unauthorized);
        assertFalse(registry.isVerifier(unauthorized));
        
        // Set required approvals failure
        vm.expectRevert("AssetRegistry: required > verifiers");
        registry.setRequiredApprovals(3); // Only 2 verifiers left
        
        vm.stopPrank();
    }

    function testUpdateAssetGovernance() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        // Approve and Finalize first
        vm.prank(verifier1);
        registry.approveAsset(assetId);
        vm.prank(verifier2);
        registry.approveAsset(assetId);
        registry.finalizeAsset(assetId);

        // 1. Propose Update
        vm.prank(issuer);
        uint256 requestId = registry.proposeAssetUpdate(assetId, "QmNewHash456");

        (uint256 reqId, uint256 aId, string memory newHash, uint256 approvals, bool executed, address proposer) = registry.updateRequests(requestId);
        assertEq(reqId, requestId);
        assertEq(aId, assetId);
        assertEq(newHash, "QmNewHash456");
        assertEq(approvals, 0);
        assertFalse(executed);
        assertEq(proposer, issuer);

        // 2. Approve Update
        vm.prank(verifier1);
        registry.approveAssetUpdate(requestId);
        
        vm.prank(verifier2);
        registry.approveAssetUpdate(requestId);

        (,,, approvals,,) = registry.updateRequests(requestId);
        assertEq(approvals, 2);

        // 3. Execute Update
        registry.executeAssetUpdate(requestId);

        (,,,, executed,) = registry.updateRequests(requestId);
        assertTrue(executed);

        // Verify Asset and NFT updated
        (,, string memory currentHash,,,,) = registry.assets(assetId);
        assertEq(currentHash, "QmNewHash456");
        assertEq(nft.tokenURI(assetId), "QmNewHash456");
    }

    function testUpdateValuation() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        vm.prank(verifier1);
        registry.updateAssetValue(assetId, 1500 ether);

        (,,, uint256 value,,,) = registry.assets(assetId);
        assertEq(value, 1500 ether);

        vm.prank(admin);
        registry.updateAssetValue(assetId, 2000 ether);

        (,,, uint256 val,,,) = registry.assets(assetId);
        assertEq(val, 2000 ether);

        vm.prank(issuer);
        vm.expectRevert("AssetRegistry: unauthorized");
        registry.updateAssetValue(assetId, 3000 ether);
    }

    function testAssetRetirement() public {
        vm.prank(issuer);
        uint256 assetId = registry.registerAsset("QmHash123", 1000 ether);

        vm.prank(admin);
        registry.setAssetStatus(assetId, AssetRegistry.AssetStatus.Delisted);

        (,,,, AssetRegistry.AssetStatus status,,) = registry.assets(assetId);
        assertEq(uint256(status), uint256(AssetRegistry.AssetStatus.Delisted));
    }
}
