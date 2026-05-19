// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRollupVerifier} from "./IRollupVerifier.sol";

interface IRollupGroth16Verifier {
    function verifyProof(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[3] calldata pubSignals
    ) external view returns (bool);
}

contract RollupVerifierAdapter is IRollupVerifier {
    IRollupGroth16Verifier public immutable verifier;

    constructor(address verifierAddress) {
        verifier = IRollupGroth16Verifier(verifierAddress);
    }

    function verifyProof(bytes calldata proof, uint256[] calldata publicSignals) external view returns (bool) {
        if (publicSignals.length != 3) {
            return false;
        }

        (uint256[2] memory pA, uint256[2][2] memory pB, uint256[2] memory pC) =
            abi.decode(proof, (uint256[2], uint256[2][2], uint256[2]));

        uint256[3] memory fixedPublicSignals = [publicSignals[0], publicSignals[1], publicSignals[2]];

        return verifier.verifyProof(pA, pB, pC, fixedPublicSignals);
    }
}
