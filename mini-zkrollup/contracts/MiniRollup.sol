// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRollupVerifier} from "./IRollupVerifier.sol";

contract MiniRollup {
    uint256 public stateRoot;
    IRollupVerifier public immutable verifier;

    event BatchSubmitted(uint256 indexed oldRoot, uint256 indexed newRoot, uint256 indexed batchHash);

    error InvalidOldRoot(uint256 expected, uint256 actual);
    error InvalidPublicSignals();
    error InvalidProof();

    constructor(uint256 initialRoot, address verifierAddress) {
        stateRoot = initialRoot;
        verifier = IRollupVerifier(verifierAddress);
    }

    function submitBatch(
        bytes calldata proof,
        uint256 oldRoot,
        uint256 newRoot,
        uint256 batchHash
    ) external {
        if (oldRoot != stateRoot) {
            revert InvalidOldRoot(stateRoot, oldRoot);
        }

        uint256[] memory publicSignals = new uint256[](3);
        publicSignals[0] = oldRoot;
        publicSignals[1] = newRoot;
        publicSignals[2] = batchHash;

        if (!verifier.verifyProof(proof, publicSignals)) {
            revert InvalidProof();
        }

        stateRoot = newRoot;
        emit BatchSubmitted(oldRoot, newRoot, batchHash);
    }
}
