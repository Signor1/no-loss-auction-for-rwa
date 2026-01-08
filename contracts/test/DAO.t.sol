// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/DAO.sol";
import "../src/RWAGovernanceToken.sol";
import "../src/Timelock.sol";

contract DAOTest is Test {
    DAO internal dao;
    RWAGovernanceToken internal token;
    Timelock internal timelock;

    address internal admin;
    address internal voter1;
    address internal voter2;
    address internal proposer;

    uint256 internal constant MIN_DELAY = 1 days;
    uint256 internal constant VOTING_DELAY = 1; // 1 block
    uint256 internal constant VOTING_PERIOD = 5; // 5 blocks
    uint256 internal constant PROPOSAL_THRESHOLD = 100 * 1e18;
    uint256 internal constant QUORUM_VOTES = 1_000 * 1e18;

    function setUp() public {
        admin = makeAddr("admin");
        voter1 = makeAddr("voter1");
        voter2 = makeAddr("voter2");
        proposer = makeAddr("proposer");

        vm.startPrank(admin);
        
        // 1. Token (minted to admin)
        token = new RWAGovernanceToken("RWA Vote", "RWAV");
        
        // 2. Timelock
        timelock = new Timelock(admin);
        
        // 3. DAO
        dao = new DAO(
            address(timelock),
            address(token),
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_VOTES
        );
        
        // Setup Tokens: Transfer to voters and proposer
        token.transfer(voter1, 500 * 1e18);
        token.transfer(voter2, 600 * 1e18); // Voter 2 + Voter 1 > Quorum
        token.transfer(proposer, 200 * 1e18); // > Threshold
        
        vm.stopPrank();

        // Delegate votes to self to activate checkpoints
        vm.prank(voter1);
        token.delegate(voter1);
        
        vm.prank(voter2);
        token.delegate(voter2);
        
        vm.prank(proposer);
        token.delegate(proposer);
        
        // Mine a block to ensure checkpoints are recorded before proposal
        vm.roll(block.number + 1);
    }

    function testProposalLifecycle() public {
        address[] memory targets = new address[](1);
        targets[0] = address(0xDEAD);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";
        string memory description = "Test Proposal";

        // 1. Propose
        vm.prank(proposer);
        uint256 proposalId = dao.propose(targets, values, calldatas, description);
        
        assertEq(uint256(dao.state(proposalId)), uint256(DAO.ProposalState.Pending));
        
        // 2. Advance to Active
        vm.roll(block.number + VOTING_DELAY + 1);
        assertEq(uint256(dao.state(proposalId)), uint256(DAO.ProposalState.Active));
        
        // 3. Vote
        vm.prank(voter1);
        dao.castVote(proposalId, 1); // For
        
        vm.prank(voter2);
        dao.castVote(proposalId, 1); // For
        
        // 4. Advance to End
        vm.roll(block.number + VOTING_PERIOD + 1);
        assertEq(uint256(dao.state(proposalId)), uint256(DAO.ProposalState.Succeeded));
        
        // 5. Queue
        dao.queue(proposalId);
        assertEq(uint256(dao.state(proposalId)), uint256(DAO.ProposalState.Queued));
    }

    function testQuorumNotReached() public {
        address[] memory targets = new address[](1);
        targets[0] = address(0xDEAD);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";
        
        vm.prank(proposer);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Quorum Test");
        
        vm.roll(block.number + VOTING_DELAY + 1);
        
        // Only voter1 votes (500 < 1000 quorum)
        vm.prank(voter1);
        dao.castVote(proposalId, 1);
        
        vm.roll(block.number + VOTING_PERIOD + 1);
        assertEq(uint256(dao.state(proposalId)), uint256(DAO.ProposalState.Defeated));
    }
}
