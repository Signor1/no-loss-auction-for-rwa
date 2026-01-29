// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/TokenizationEngine.sol";
import "../src/AssetRegistry.sol";
import "../src/RWAAssetNFT.sol";
import "../src/RWAFractionalToken.sol";
import "../src/DividendDistributor.sol";
import "../src/lib/IERC20.sol";
import "./MockERC20.sol";

contract TokenizationEngineTest is Test {
    TokenizationEngine internal engine;
    AssetRegistry internal registry;
    RWAAssetNFT internal nft;
    MockERC20 internal rewardToken;

    address internal admin = address(0xA11CE);
    address internal verifier1 = address(0xB0B);
    address internal verifier2 = address(0xCA55);
    address internal issuer = address(0xF00);
    address internal user1 = address(0x1);
    address internal user2 = address(0x2);

    uint256 internal assetId;

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy Infrastructure
        nft = new RWAAssetNFT("Real World Asset", "RWA", admin, false);
        
        address[] memory verifiers = new address[](2);
        verifiers[0] = verifier1;
        verifiers[1] = verifier2;
        
        registry = new AssetRegistry(address(nft), verifiers, 2);
        nft.setComplianceAdmin(address(registry));
        
        engine = new TokenizationEngine(address(registry), address(nft));
        
        rewardToken = new MockERC20("USDC", "USDC", 18);
        vm.stopPrank();

        // Setup Asset
        vm.startPrank(issuer);
        assetId = registry.registerAsset("QmHash123", 1000 ether);
        vm.stopPrank();

        vm.prank(verifier1);
        registry.approveAsset(assetId);
        
        vm.prank(verifier2);
        registry.approveAsset(assetId);
        
        registry.finalizeAsset(assetId); // Mints NFT to issuer
    }

    function testFractionalize() public {
        vm.startPrank(issuer);
        
        // Approve Engine to take NFT
        nft.approve(address(engine), assetId);
        
        uint256 supply = 1_000_000 ether;
        
        (address tokenAddr, address distAddr) = engine.fractionalize(
            assetId,
            "Fractional RWA",
            "fRWA",
            supply,
            1000 ether
        );
        
        vm.stopPrank();

        // Verify state
        assertEq(nft.ownerOf(assetId), address(engine));
        
        RWAFractionalToken token = RWAFractionalToken(tokenAddr);
        assertEq(token.totalSupply(), supply);
        assertEq(token.balanceOf(issuer), supply);
        assertEq(token.complianceAdmin(), distAddr); // Distributor is admin
        
        (address savedToken, address savedDist, bool active, uint256 savedSupply, ) = engine.tokenizedAssets(assetId);
        assertEq(savedToken, tokenAddr);
        assertEq(savedDist, distAddr);
        assertTrue(active);
        assertEq(savedSupply, supply);
    }

    function testDividendDistribution() public {
        // 1. Fractionalize
        vm.startPrank(issuer);
        nft.approve(address(engine), assetId);
        (address tokenAddr, address distAddr) = engine.fractionalize(
            assetId, "fRWA", "fRWA", 100 ether, 100 ether
        );
        vm.stopPrank();

        RWAFractionalToken token = RWAFractionalToken(tokenAddr);
        DividendDistributor distributor = DividendDistributor(distAddr);

        // 2. Transfer some tokens to user1
        vm.startPrank(issuer);
        token.setWhitelist(user1, true); // Whitelist user1
        token.transfer(user1, 10 ether); // 10%
        vm.stopPrank();

        // 3. Deposit Dividends
        vm.startPrank(admin);
        rewardToken.mint(admin, 1000 ether);
        rewardToken.approve(distAddr, 1000 ether);
        
        distributor.depositDividend(address(rewardToken), 100 ether);
        vm.stopPrank();

        // 4. Check Claimable
        // Snapshot was taken at deposit. User1 had 10% at that time.
        // Entitlement = 100 * 0.10 = 10 ether
        
        uint256 claimable = distributor.getClaimableAmount(user1, 0);
        assertEq(claimable, 10 ether);

        // 5. Claim
        uint256 balanceBefore = rewardToken.balanceOf(user1);
        vm.prank(user1);
        distributor.claimDividend(0);
        
        assertEq(rewardToken.balanceOf(user1), balanceBefore + 10 ether);
        assertEq(distributor.getClaimableAmount(user1, 0), 0);
    }

    function testUnfractionalize() public {
        // 1. Fractionalize
        vm.startPrank(issuer);
        nft.approve(address(engine), assetId);
        (address tokenAddr, ) = engine.fractionalize(
            assetId, "fRWA", "fRWA", 100 ether, 100 ether
        );
        vm.stopPrank();

        RWAFractionalToken token = RWAFractionalToken(tokenAddr);

        // 2. Issuer has 100%. Unfractionalize.
        vm.startPrank(issuer);
        token.approve(address(engine), 100 ether);
        engine.unfractionalize(assetId);
        vm.stopPrank();

        // 3. Verify
        assertEq(nft.ownerOf(assetId), issuer);
        assertEq(token.totalSupply(), 0);
        
        (,, bool active,,) = engine.tokenizedAssets(assetId);
        assertFalse(active);
    }
    
    function testUnfractionalizeFailIfNotFullSupply() public {
        // 1. Fractionalize
        vm.startPrank(issuer);
        nft.approve(address(engine), assetId);
        (address tokenAddr, ) = engine.fractionalize(
            assetId, "fRWA", "fRWA", 100 ether, 100 ether
        );
        
        // Transfer 1 wei to user1
        RWAFractionalToken token = RWAFractionalToken(tokenAddr);
        token.setWhitelist(user1, true);
        token.transfer(user1, 1);
        vm.stopPrank();

        // 2. Try to unfractionalize
        vm.startPrank(issuer);
        vm.expectRevert("TokenizationEngine: must hold 100%");
        engine.unfractionalize(assetId);
        vm.stopPrank();
    }
}
