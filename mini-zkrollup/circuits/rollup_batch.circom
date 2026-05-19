pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template AccountLeaf(accountId) {
    signal input balance;
    signal output leaf;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== accountId;
    hasher.inputs[1] <== balance;
    leaf <== hasher.out;
}

template MerkleRoot4() {
    signal input balances[4];
    signal output root;

    component leaf0 = AccountLeaf(0);
    component leaf1 = AccountLeaf(1);
    component leaf2 = AccountLeaf(2);
    component leaf3 = AccountLeaf(3);

    leaf0.balance <== balances[0];
    leaf1.balance <== balances[1];
    leaf2.balance <== balances[2];
    leaf3.balance <== balances[3];

    component left = Poseidon(2);
    component right = Poseidon(2);
    component top = Poseidon(2);

    left.inputs[0] <== leaf0.leaf;
    left.inputs[1] <== leaf1.leaf;
    right.inputs[0] <== leaf2.leaf;
    right.inputs[1] <== leaf3.leaf;
    top.inputs[0] <== left.out;
    top.inputs[1] <== right.out;

    root <== top.out;
}

template TransferStep(BALANCE_BITS) {
    signal input before[4];
    signal input from;
    signal input to;
    signal input amount;
    signal output after[4];
    signal output txHash;

    component amountBits = Num2Bits(BALANCE_BITS);
    amountBits.in <== amount;

    component eqFrom[4];
    component eqTo[4];
    component afterBits[4];
    signal subDelta[4];
    signal addDelta[4];
    signal selectedPart[4];

    var fromSum = 0;
    var toSum = 0;
    var selectedFromBalance = 0;

    for (var i = 0; i < 4; i++) {
        eqFrom[i] = IsEqual();
        eqTo[i] = IsEqual();

        eqFrom[i].in[0] <== from;
        eqFrom[i].in[1] <== i;
        eqTo[i].in[0] <== to;
        eqTo[i].in[1] <== i;

        fromSum += eqFrom[i].out;
        toSum += eqTo[i].out;
        selectedPart[i] <== eqFrom[i].out * before[i];
        selectedFromBalance += selectedPart[i];

        subDelta[i] <== eqFrom[i].out * amount;
        addDelta[i] <== eqTo[i].out * amount;
        after[i] <== before[i] - subDelta[i] + addDelta[i];

        afterBits[i] = Num2Bits(BALANCE_BITS);
        afterBits[i].in <== after[i];
    }

    fromSum === 1;
    toSum === 1;

    component insufficient = LessThan(BALANCE_BITS);
    insufficient.in[0] <== selectedFromBalance;
    insufficient.in[1] <== amount;
    insufficient.out === 0;

    component txHasher = Poseidon(3);
    txHasher.inputs[0] <== from;
    txHasher.inputs[1] <== to;
    txHasher.inputs[2] <== amount;
    txHash <== txHasher.out;
}

template RollupBatch(BALANCE_BITS) {
    signal input oldStateRoot;
    signal input newStateRoot;
    signal input batchHash;

    signal input oldBalances[4];
    signal input from[2];
    signal input to[2];
    signal input amount[2];

    component oldBalanceBits[4];
    for (var i = 0; i < 4; i++) {
        oldBalanceBits[i] = Num2Bits(BALANCE_BITS);
        oldBalanceBits[i].in <== oldBalances[i];
    }

    component oldRoot = MerkleRoot4();
    for (var j = 0; j < 4; j++) {
        oldRoot.balances[j] <== oldBalances[j];
    }
    oldRoot.root === oldStateRoot;

    component tx0 = TransferStep(BALANCE_BITS);
    for (var k = 0; k < 4; k++) {
        tx0.before[k] <== oldBalances[k];
    }
    tx0.from <== from[0];
    tx0.to <== to[0];
    tx0.amount <== amount[0];

    component tx1 = TransferStep(BALANCE_BITS);
    for (var m = 0; m < 4; m++) {
        tx1.before[m] <== tx0.after[m];
    }
    tx1.from <== from[1];
    tx1.to <== to[1];
    tx1.amount <== amount[1];

    component newRoot = MerkleRoot4();
    for (var n = 0; n < 4; n++) {
        newRoot.balances[n] <== tx1.after[n];
    }
    newRoot.root === newStateRoot;

    component batchHasher = Poseidon(2);
    batchHasher.inputs[0] <== tx0.txHash;
    batchHasher.inputs[1] <== tx1.txHash;
    batchHasher.out === batchHash;
}

component main { public [oldStateRoot, newStateRoot, batchHash] } = RollupBatch(32);
