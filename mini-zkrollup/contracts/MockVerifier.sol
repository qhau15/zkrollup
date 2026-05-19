// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRollupVerifier} from "./IRollupVerifier.sol";

contract MockVerifier is IRollupVerifier {
    bytes32 public validProofHash;
    bytes32 public validPublicSignalsHash;

    function setExpected(bytes calldata proof, uint256[] calldata publicSignals) external {
        validProofHash = keccak256(proof);
        validPublicSignalsHash = keccak256(abi.encode(publicSignals));
    }

    function verifyProof(bytes calldata proof, uint256[] calldata publicSignals) external view returns (bool) {
        return keccak256(proof) == validProofHash && keccak256(abi.encode(publicSignals)) == validPublicSignalsHash;
    }
}
