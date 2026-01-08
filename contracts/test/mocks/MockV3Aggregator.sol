// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "../../src/lib/AggregatorV3Interface.sol";

contract MockV3Aggregator is AggregatorV3Interface {
    uint8 public _decimals;
    int256 public _latestAnswer;
    uint256 public _updatedAt;

    constructor(uint8 decimals_, int256 initialAnswer) {
        _decimals = decimals_;
        updateAnswer(initialAnswer);
    }

    function updateAnswer(int256 answer) public {
        _latestAnswer = answer;
        _updatedAt = block.timestamp;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external pure override returns (string memory) {
        return "Mock Aggregator";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId) external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (_roundId, _latestAnswer, _updatedAt, _updatedAt, _roundId);
    }

    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _latestAnswer, _updatedAt, _updatedAt, 1);
    }
}
