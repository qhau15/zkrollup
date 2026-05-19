pragma circom 2.1.6;

// Design skeleton for Version 3.
// This file documents the target circuit shape. The first executable MVP is
// transfer.circom; this circuit is intentionally kept as a next implementation
// milestone because full sequential Merkle updates are more involved.

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template BatchWithRoots(BATCH_SIZE, TREE_DEPTH, BALANCE_BITS) {
    signal input oldStateRoot;
    signal input newStateRoot;
    signal input batchHash;

    signal input from[BATCH_SIZE];
    signal input to[BATCH_SIZE];
    signal input amount[BATCH_SIZE];

    signal input oldFromBalance[BATCH_SIZE];
    signal input oldToBalance[BATCH_SIZE];
    signal input newFromBalance[BATCH_SIZE];
    signal input newToBalance[BATCH_SIZE];

    signal input fromPath[BATCH_SIZE][TREE_DEPTH];
    signal input toPath[BATCH_SIZE][TREE_DEPTH];
    signal input fromPathIndex[BATCH_SIZE][TREE_DEPTH];
    signal input toPathIndex[BATCH_SIZE][TREE_DEPTH];

    // TODO:
    // 1. Rebuild old root from account leaves and Merkle paths.
    // 2. Check transfer constraints for every transaction.
    // 3. Rebuild intermediate roots after every updated leaf.
    // 4. Enforce final root == newStateRoot.
    // 5. Recompute tx hashes and batchHash with Poseidon.
}

component main { public [oldStateRoot, newStateRoot, batchHash] } = BatchWithRoots(2, 2, 32);
