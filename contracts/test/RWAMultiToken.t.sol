// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/RWAMultiToken.sol";

contract RWAMultiTokenTest is Test {
    RWAMultiToken internal token;
    address internal owner = address(0xA11CE);
    address internal compliance = address(0xBEEF);
    address internal user1 = address(0x1);
    address internal user2 = address(0x2);
    address internal user3 = address(0x3);

    function setUp() public {
        vm.prank(owner);
        token = new RWAMultiToken(owner, true); // transferRestrictionsEnabled = true

        vm.prank(owner);
        token.setComplianceAdmin(compliance);

        // Whitelist users
        vm.prank(owner);
        token.setWhitelist(owner, true);

        vm.prank(compliance);
        token.setWhitelist(user1, true);

        vm.prank(compliance);
        token.setWhitelist(user2, true);

        vm.prank(compliance);
        token.setWhitelist(user3, true);
    }

    function testInitialConfig() public view {
        assertEq(token.owner(), owner);
        assertEq(token.complianceAdmin(), compliance);
        assertTrue(token.transferRestrictionsEnabled());
        assertFalse(token.paused());
    }

    function testMintFungibleToken() public {
        uint256 tokenId = 1;
        uint256 amount = 1000;

        vm.prank(owner);
        token.mint(user1, tokenId, amount, "");

        assertEq(token.balanceOf(user1, tokenId), amount);
        assertEq(token.totalSupply(tokenId), amount);
        assertTrue(token.exists(tokenId));
    }

    function testMintNonFungibleToken() public {
        uint256 tokenId = 100;
        uint256 amount = 1; // NFT

        vm.prank(owner);
        token.mint(user1, tokenId, amount, "");

        assertEq(token.balanceOf(user1, tokenId), 1);
        assertEq(token.totalSupply(tokenId), 1);
        assertTrue(token.exists(tokenId));
    }

    function testMintMultipleFungibleTokens() public {
        uint256 tokenId1 = 1;
        uint256 tokenId2 = 2;
        uint256 amount1 = 500;
        uint256 amount2 = 750;

        vm.prank(owner);
        token.mint(user1, tokenId1, amount1, "");

        vm.prank(compliance);
        token.mint(user1, tokenId2, amount2, "");

        assertEq(token.balanceOf(user1, tokenId1), amount1);
        assertEq(token.balanceOf(user1, tokenId2), amount2);
        assertEq(token.totalSupply(tokenId1), amount1);
        assertEq(token.totalSupply(tokenId2), amount2);
    }

    function testBatchMint() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1;
        ids[1] = 2;
        ids[2] = 3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 1; // NFT

        vm.prank(owner);
        token.mintBatch(user1, ids, amounts, "");

        assertEq(token.balanceOf(user1, 1), 100);
        assertEq(token.balanceOf(user1, 2), 200);
        assertEq(token.balanceOf(user1, 3), 1);
        assertEq(token.totalSupply(1), 100);
        assertEq(token.totalSupply(2), 200);
        assertEq(token.totalSupply(3), 1);
    }

    function testTransferSingleToken() public {
        uint256 tokenId = 1;
        uint256 mintAmount = 1000;
        uint256 transferAmount = 300;

        vm.prank(owner);
        token.mint(user1, tokenId, mintAmount, "");

        vm.prank(user1);
        token.safeTransferFrom(user1, user2, tokenId, transferAmount, "");

        assertEq(token.balanceOf(user1, tokenId), mintAmount - transferAmount);
        assertEq(token.balanceOf(user2, tokenId), transferAmount);
        assertEq(token.totalSupply(tokenId), mintAmount); // Supply unchanged
    }

    function testBatchTransfer() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = 1;
        ids[1] = 2;

        uint256[] memory mintAmounts = new uint256[](2);
        mintAmounts[0] = 1000;
        mintAmounts[1] = 500;

        uint256[] memory transferAmounts = new uint256[](2);
        transferAmounts[0] = 300;
        transferAmounts[1] = 200;

        vm.prank(owner);
        token.mintBatch(user1, ids, mintAmounts, "");

        vm.prank(user1);
        token.safeBatchTransferFrom(user1, user2, ids, transferAmounts, "");

        assertEq(token.balanceOf(user1, 1), 700);
        assertEq(token.balanceOf(user1, 2), 300);
        assertEq(token.balanceOf(user2, 1), 300);
        assertEq(token.balanceOf(user2, 2), 200);
    }

    function testTransferRevertsWhenRecipientNotWhitelisted() public {
        uint256 tokenId = 1;
        address nonWhitelisted = address(0xBAD);

        vm.prank(owner);
        token.mint(user1, tokenId, 100, "");

        vm.prank(user1);
        vm.expectRevert("RWA1155: recipient not whitelisted");
        token.safeTransferFrom(user1, nonWhitelisted, tokenId, 10, "");
    }

    function testTransferRevertsWhenSenderNotWhitelisted() public {
        uint256 tokenId = 1;
        address nonWhitelisted = address(0xBAD);

        // Don't whitelist the sender - they should not be able to transfer
        // But we need to mint to them, which is allowed (mint is exempt from restrictions)
        vm.prank(owner);
        token.mint(nonWhitelisted, tokenId, 100, "");

        // Now try to transfer - should fail because sender is not whitelisted
        vm.prank(nonWhitelisted);
        vm.expectRevert("RWA1155: sender not whitelisted");
        token.safeTransferFrom(nonWhitelisted, user1, tokenId, 10, "");
    }

    function testDisableTransferRestrictionsAllowsFreeTransfers() public {
        uint256 tokenId = 1;
        address nonWhitelisted = address(0x1234);

        vm.prank(owner);
        token.mint(user1, tokenId, 100, "");

        vm.prank(owner);
        token.setTransferRestrictionsEnabled(false);

        vm.prank(user1);
        token.safeTransferFrom(user1, nonWhitelisted, tokenId, 10, "");

        assertEq(token.balanceOf(nonWhitelisted, tokenId), 10);
    }

    function testPauseAndUnpause() public {
        uint256 tokenId = 1;

        vm.prank(owner);
        token.mint(user1, tokenId, 100, "");

        vm.prank(compliance);
        token.pause();

        vm.prank(user1);
        vm.expectRevert("RWA1155: paused");
        token.safeTransferFrom(user1, user2, tokenId, 10, "");

        vm.prank(owner);
        token.unpause();

        vm.prank(user1);
        token.safeTransferFrom(user1, user2, tokenId, 10, "");
        assertEq(token.balanceOf(user2, tokenId), 10);
    }

    function testBurnReducesSupply() public {
        uint256 tokenId = 1;
        uint256 mintAmount = 1000;
        uint256 burnAmount = 300;

        vm.prank(owner);
        token.mint(user1, tokenId, mintAmount, "");

        vm.prank(owner);
        token.burn(user1, tokenId, burnAmount);

        assertEq(token.balanceOf(user1, tokenId), mintAmount - burnAmount);
        assertEq(token.totalSupply(tokenId), mintAmount - burnAmount);
    }

    function testBatchBurn() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = 1;
        ids[1] = 2;

        uint256[] memory mintAmounts = new uint256[](2);
        mintAmounts[0] = 1000;
        mintAmounts[1] = 500;

        uint256[] memory burnAmounts = new uint256[](2);
        burnAmounts[0] = 200;
        burnAmounts[1] = 100;

        vm.prank(owner);
        token.mintBatch(user1, ids, mintAmounts, "");

        vm.prank(owner);
        token.burnBatch(user1, ids, burnAmounts);

        assertEq(token.balanceOf(user1, 1), 800);
        assertEq(token.balanceOf(user1, 2), 400);
        assertEq(token.totalSupply(1), 800);
        assertEq(token.totalSupply(2), 400);
    }

    function testMetadataURI() public {
        uint256 tokenId = 1;

        vm.prank(owner);
        token.mint(user1, tokenId, 100, "");

        // Test base URI
        vm.prank(owner);
        token.setBaseURI("https://api.example.com/token/");

        string memory uri = token.uri(tokenId);
        assertEq(uri, "https://api.example.com/token/1");

        // Test per-token URI override
        vm.prank(owner);
        token.setTokenURI(tokenId, "ipfs://QmHash123");

        uri = token.uri(tokenId);
        assertEq(uri, "ipfs://QmHash123");
    }

    function testBalanceOfBatch() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1;
        ids[1] = 2;
        ids[2] = 3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 300;

        vm.prank(owner);
        token.mintBatch(user1, ids, amounts, "");

        address[] memory accounts = new address[](3);
        accounts[0] = user1;
        accounts[1] = user1;
        accounts[2] = user1;

        uint256[] memory balances = token.balanceOfBatch(accounts, ids);
        assertEq(balances[0], 100);
        assertEq(balances[1], 200);
        assertEq(balances[2], 300);
    }

    function testApprovalForAll() public {
        uint256 tokenId = 1;

        vm.prank(owner);
        token.mint(user1, tokenId, 100, "");

        vm.prank(user1);
        token.setApprovalForAll(user2, true);

        assertTrue(token.isApprovedForAll(user1, user2));

        vm.prank(user2);
        token.safeTransferFrom(user1, user2, tokenId, 50, "");

        assertEq(token.balanceOf(user2, tokenId), 50);
    }

    function testExistsReturnsFalseForUnmintedToken() public view {
        assertFalse(token.exists(999));
        assertEq(token.totalSupply(999), 0);
    }

    function testSupportsInterface() public view {
        assertTrue(token.supportsInterface(0x01ffc9a7)); // ERC165
        assertTrue(token.supportsInterface(0xd9b67a26)); // ERC1155
        assertTrue(token.supportsInterface(0x0e89341c)); // ERC1155MetadataURI
    }

    function testFungibleAndNonFungibleInSameContract() public {
        // Mint fungible token (ID 1)
        vm.prank(owner);
        token.mint(user1, 1, 1000, "");

        // Mint non-fungible tokens (IDs 100, 101, 102)
        vm.prank(owner);
        token.mint(user1, 100, 1, "");
        vm.prank(owner);
        token.mint(user1, 101, 1, "");
        vm.prank(owner);
        token.mint(user1, 102, 1, "");

        assertEq(token.balanceOf(user1, 1), 1000);
        assertEq(token.balanceOf(user1, 100), 1);
        assertEq(token.balanceOf(user1, 101), 1);
        assertEq(token.balanceOf(user1, 102), 1);

        assertEq(token.totalSupply(1), 1000);
        assertEq(token.totalSupply(100), 1);
        assertEq(token.totalSupply(101), 1);
        assertEq(token.totalSupply(102), 1);
    }

    function testBatchTransferMixedFungibleAndNonFungible() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1; // Fungible
        ids[1] = 100; // NFT
        ids[2] = 2; // Fungible

        uint256[] memory mintAmounts = new uint256[](3);
        mintAmounts[0] = 1000;
        mintAmounts[1] = 1;
        mintAmounts[2] = 500;

        uint256[] memory transferAmounts = new uint256[](3);
        transferAmounts[0] = 300; // Partial fungible
        transferAmounts[1] = 1; // Full NFT
        transferAmounts[2] = 200; // Partial fungible

        vm.prank(owner);
        token.mintBatch(user1, ids, mintAmounts, "");

        vm.prank(user1);
        token.safeBatchTransferFrom(user1, user2, ids, transferAmounts, "");

        assertEq(token.balanceOf(user1, 1), 700);
        assertEq(token.balanceOf(user1, 100), 0);
        assertEq(token.balanceOf(user1, 2), 300);
        assertEq(token.balanceOf(user2, 1), 300);
        assertEq(token.balanceOf(user2, 100), 1);
        assertEq(token.balanceOf(user2, 2), 200);
    }
}

