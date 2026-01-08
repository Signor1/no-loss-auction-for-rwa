// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title Timelock
/// @notice Delays execution of critical transactions.
contract Timelock {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event CallQueued(bytes32 indexed id, address indexed target, uint256 value, bytes data, uint256 eta);
    event CallExecuted(bytes32 indexed id, address indexed target, uint256 value, bytes data);
    event CallCancelled(bytes32 indexed id);

    // =============================================================
    //                          STORAGE
    // =============================================================

    address public admin;
    uint256 public constant MIN_DELAY = 1 days;
    uint256 public constant MAX_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;

    mapping(bytes32 => bool) public queuedTransactions;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Timelock: not admin");
        _;
    }

    constructor(address _admin) {
        require(_admin != address(0), "Timelock: zero address");
        admin = _admin;
    }

    // =============================================================
    //                    PUBLIC FUNCTIONS
    // =============================================================

    receive() external payable {}

    function queueTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external onlyAdmin returns (bytes32) {
        require(eta >= block.timestamp + MIN_DELAY, "Timelock: delay too short");
        require(eta <= block.timestamp + MAX_DELAY, "Timelock: delay too long");

        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        queuedTransactions[txHash] = true;

        emit CallQueued(txHash, target, value, data, eta);
        return txHash;
    }

    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external payable onlyAdmin returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        require(queuedTransactions[txHash], "Timelock: transaction not queued");
        require(block.timestamp >= eta, "Timelock: transaction not ready");
        require(block.timestamp <= eta + GRACE_PERIOD, "Timelock: transaction stale");

        queuedTransactions[txHash] = false;

        (bool success, bytes memory returnData) = target.call{value: value}(data);
        require(success, "Timelock: transaction failed");

        emit CallExecuted(txHash, target, value, data);
        return returnData;
    }

    function cancelTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external onlyAdmin {
        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        queuedTransactions[txHash] = false;

        emit CallCancelled(txHash);
    }
}
