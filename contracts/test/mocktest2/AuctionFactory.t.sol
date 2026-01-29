// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/NoLossAuction.sol";
import "../src/AuctionFactory.sol";
import "./MockERC20.sol";

contract AuctionFactoryTest is Test {
    NoLossAuction internal auction;
    AuctionFactory internal factory;
    MockERC20 internal assetToken;
    MockERC20 internal paymentToken;
    
    address internal owner = address(0xA11CE);
    address internal feeReceiver = address(0xFEE);
    address internal user = address(0xCAFE);
    uint256 internal creationFee = 0.1 ether;

    event AuctionCreatedFromFactory(
        uint256 indexed auctionId,
        uint256 indexed templateId,
        address indexed creator,
        address assetToken,
        uint256 assetId,
        uint256 amount
    );

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(user, 100 ether);
        
        vm.startPrank(owner);
        // Deploy core auction
        auction = new NoLossAuction(owner);
        
        // Deploy factory
        factory = new AuctionFactory(address(auction), feeReceiver, creationFee);
        
        // Deploy tokens
        assetToken = new MockERC20("Asset Token", "AST", 18);
        paymentToken = new MockERC20("Payment Token", "PAY", 18);
        
        // Setup initial balances
        assetToken.mint(user, 1000 ether);
        
        vm.stopPrank();
    }

    function testInitialSetup() public {
        assertEq(address(factory.noLossAuction()), address(auction));
        assertEq(factory.feeReceiver(), feeReceiver);
        assertEq(factory.creationFee(), creationFee);
        
        // Check default template
        (
            string memory name,
            uint256 minBidIncrement,
            uint256 bidExpirationPeriod,
            uint256 withdrawalPenaltyBps,
            bool autoSettleEnabled,
            uint256 withdrawalLockPeriod,
            bool secureEscrowEnabled,
            bool active
        ) = factory.templates(0);
        
        assertEq(name, "Standard Auction");
        assertEq(minBidIncrement, 0.01 ether);
        assertTrue(active);
    }

    function testAddTemplate() public {
        vm.prank(owner);
        uint256 templateId = factory.addTemplate(
            "Premium Auction",
            1 ether,
            1 days,
            500, // 5% penalty
            true,
            7 days,
            true
        );

        (string memory name,,,,,,,) = factory.templates(templateId);
        assertEq(name, "Premium Auction");
    }

    function testCreateAuctionFromFactory() public {
        uint256 assetAmount = 100 ether;
        uint256 reservePrice = 10 ether;
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(user);
        
        // Approve factory to spend asset
        assetToken.approve(address(factory), assetAmount);
        
        // Expect event
        vm.expectEmit(true, true, true, true);
        emit AuctionCreatedFromFactory(
            0, // first auction ID
            0, // default template ID
            user,
            address(assetToken),
            0,
            assetAmount
        );

        // Create auction
        uint256 auctionId = factory.createAuction{value: creationFee}(
            0, // templateId
            address(assetToken),
            0,
            assetAmount,
            reservePrice,
            startTime,
            endTime,
            address(0) // ETH payment
        );

        vm.stopPrank();

        // Verify auction created on core contract
        NoLossAuction.Auction memory a = auction.getAuction(auctionId);
        assertEq(a.seller, address(factory)); // Seller is factory (proxy)? 
        // Wait, if seller is factory, then factory receives proceeds. 
        // The NoLossAuction contract sends funds to 'seller'.
        // So `AuctionFactory` needs to implement receive() and forward funds? 
        // OR `AuctionFactory` should call `createAuction` but msg.sender remains factory.
        // If `NoLossAuction.createAuction` uses `msg.sender` as seller, then Factory is seller.
        
        // Let's verify this behavior.
        assertEq(a.seller, address(factory));
        
        // Verify registry
        assertEq(factory.getCreatedAuctionsCount(), 1);
        uint256[] memory userAuctions = factory.getAuctionsByCreator(user);
        assertEq(userAuctions[0], auctionId);
        assertTrue(factory.isCreatedByFactory(auctionId));
    }

    function testFeeCollection() public {
        uint256 assetAmount = 100 ether;
        uint256 reservePrice = 10 ether;
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(user);
        assetToken.approve(address(factory), assetAmount);
        
        uint256 receiverBalanceBefore = feeReceiver.balance;
        
        factory.createAuction{value: creationFee}(
            0,
            address(assetToken),
            0,
            assetAmount,
            reservePrice,
            startTime,
            endTime,
            address(0)
        );
        
        assertEq(feeReceiver.balance, receiverBalanceBefore + creationFee);
        vm.stopPrank();
    }

    function testExcessFeeRefund() public {
        uint256 assetAmount = 100 ether;
        uint256 reservePrice = 10 ether;
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 24 hours;

        vm.startPrank(user);
        assetToken.approve(address(factory), assetAmount);
        
        uint256 userBalanceBefore = user.balance;
        uint256 paidAmount = creationFee + 1 ether;
        
        factory.createAuction{value: paidAmount}(
            0,
            address(assetToken),
            0,
            assetAmount,
            reservePrice,
            startTime,
            endTime,
            address(0)
        );
        
        uint256 userBalanceAfter = user.balance;
        // User should have spent exactly creationFee
        assertEq(userBalanceBefore - userBalanceAfter, creationFee);
        vm.stopPrank();
    }
}
