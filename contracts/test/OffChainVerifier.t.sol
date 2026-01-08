// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/OffChainVerifier.sol";

contract OffChainVerifierTest is Test {
    OffChainVerifier internal verifier;
    
    address internal admin = address(0xAD);
    address internal oracle1 = address(0x1);
    address internal oracle2 = address(0x2);
    address internal oracle3 = address(0x3);
    
    function setUp() public {
        vm.startPrank(admin);
        verifier = new OffChainVerifier();
        
        verifier.addOracle(oracle1);
        verifier.addOracle(oracle2);
        verifier.addOracle(oracle3);
        
        verifier.setRequiredConsensus(2);
        vm.stopPrank();
    }

    function testRequestVerification() public {
        bytes32 requestId = verifier.requestVerification(1, OffChainVerifier.VerificationType.IPFS_CHECK, "QmHash");
        
        (uint256 aId, OffChainVerifier.VerificationType vType, string memory data,,,,,) = verifier.requests(requestId);
        assertEq(aId, 1);
        assertEq(uint256(vType), uint256(OffChainVerifier.VerificationType.IPFS_CHECK));
        assertEq(data, "QmHash");
    }

    function testConsensusApproval() public {
        bytes32 requestId = verifier.requestVerification(1, OffChainVerifier.VerificationType.IPFS_CHECK, "QmHash");

        // Oracle 1 votes Yes
        vm.prank(oracle1);
        verifier.fulfillVerification(requestId, true);

        // Not yet verified
        assertFalse(verifier.isVerified(1, OffChainVerifier.VerificationType.IPFS_CHECK));

        // Oracle 2 votes Yes (Consensus reached)
        vm.prank(oracle2);
        verifier.fulfillVerification(requestId, true);

        assertTrue(verifier.isVerified(1, OffChainVerifier.VerificationType.IPFS_CHECK));
        
        (,,,,,, bool completed, bool finalResult) = verifier.requests(requestId);
        assertTrue(completed);
        assertTrue(finalResult);
    }

    function testConsensusRejection() public {
        bytes32 requestId = verifier.requestVerification(2, OffChainVerifier.VerificationType.API_DATA, "http://api");

        // Oracle 1 votes No
        vm.prank(oracle1);
        verifier.fulfillVerification(requestId, false);

        // Oracle 2 votes No
        vm.prank(oracle2);
        verifier.fulfillVerification(requestId, false);

        assertFalse(verifier.isVerified(2, OffChainVerifier.VerificationType.API_DATA));
        
        (,,,,,, bool completed, bool finalResult) = verifier.requests(requestId);
        assertTrue(completed);
        assertFalse(finalResult);
    }

    function testUnauthorizedOracle() public {
        bytes32 requestId = verifier.requestVerification(1, OffChainVerifier.VerificationType.IPFS_CHECK, "QmHash");

        vm.prank(address(0xBAD));
        vm.expectRevert("OffChainVerifier: not oracle");
        verifier.fulfillVerification(requestId, true);
    }

    function testDoubleVote() public {
        bytes32 requestId = verifier.requestVerification(1, OffChainVerifier.VerificationType.IPFS_CHECK, "QmHash");

        vm.startPrank(oracle1);
        verifier.fulfillVerification(requestId, true);
        
        vm.expectRevert("OffChainVerifier: already voted");
        verifier.fulfillVerification(requestId, true);
        vm.stopPrank();
    }
}
