// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/OracleManager.sol";
import "./mocks/MockV3Aggregator.sol";

contract OracleManagerTest is Test {
    OracleManager internal oracle;
    MockV3Aggregator internal feed1;
    MockV3Aggregator internal feed2;
    MockV3Aggregator internal feed3;

    address internal admin = address(0xAD);
    uint256 internal assetId = 1;

    event SnapshotTaken(uint256 indexed assetId, uint256 price, uint256 timestamp);
    event PriceDeviationConstraintBroken(uint256 indexed assetId, uint256 percentDeviation, uint256 newPrice, uint256 oldPrice);

    function setUp() public {
        vm.startPrank(admin);
        oracle = new OracleManager();
        
        feed1 = new MockV3Aggregator(8, 1000e8); // $1000
        feed2 = new MockV3Aggregator(8, 1010e8); // $1010
        feed3 = new MockV3Aggregator(8, 990e8);  // $990
        
        oracle.addFeed(assetId, address(feed1));
        
        vm.stopPrank();
    }

    function testAddFeed() public {
        vm.prank(admin);
        oracle.addFeed(assetId, address(feed2));
        
        // No accessor for struct array properly exposed? 
        // We can test getAssetPrice to implicitly verify
        // But for internal struct, we rely on implementation.
    }

    function testGetAssetPriceSingle() public {
        uint256 price = oracle.getAssetPrice(assetId);
        assertEq(price, 1000 ether); // Normalized to 18 decimals
    }

    function testGetAssetPriceMedian() public {
        vm.startPrank(admin);
        oracle.addFeed(assetId, address(feed2)); // 1010
        oracle.addFeed(assetId, address(feed3)); // 990
        vm.stopPrank();

        // Prices: 990, 1000, 1010. Median = 1000.
        uint256 price = oracle.getAssetPrice(assetId);
        assertEq(price, 1000 ether);

        // Update feed2 to be outlier
        feed2.updateAnswer(2000e8);
        // Prices: 990, 1000, 2000. Median = 1000.
        price = oracle.getAssetPrice(assetId);
        assertEq(price, 1000 ether);
    }

    function testSnapshot() public {
        vm.expectEmit(true, false, false, true);
        emit SnapshotTaken(assetId, 1000 ether, block.timestamp);
        
        oracle.snapshotAssetPrice(assetId);
    }

    function testDeviationAlert() public {
        oracle.snapshotAssetPrice(assetId); // 1000

        // Increase price by 10%
        feed1.updateAnswer(1100e8);

        vm.expectEmit(true, false, false, true);
        emit PriceDeviationConstraintBroken(assetId, 10, 1100 ether, 1000 ether);
        
        oracle.snapshotAssetPrice(assetId);
    }

    function testStaleness() public {
        // Warp time past threshold (3 hours)
        vm.warp(block.timestamp + 3 hours + 1 seconds);
        
        vm.expectRevert("OracleManager: stale price");
        oracle.getAssetPrice(assetId);
    }
}
