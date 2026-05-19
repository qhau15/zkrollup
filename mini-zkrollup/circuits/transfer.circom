pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template AccountLeaf() {
    signal input accountId;
    signal input balance;
    signal output leaf;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== accountId;
    hasher.inputs[1] <== balance;
    leaf <== hasher.out;
}

template Transfer(BALANCE_BITS) {
    signal input oldFromBalance;
    signal input oldToBalance;
    signal input amount;
    signal input newFromBalance;
    signal input newToBalance;

    component insufficient = LessThan(BALANCE_BITS);
    insufficient.in[0] <== oldFromBalance;
    insufficient.in[1] <== amount;
    insufficient.out === 0;

    oldFromBalance - amount === newFromBalance;
    oldToBalance + amount === newToBalance;
}

template Main(BALANCE_BITS) {
    signal input oldFromBalance;
    signal input oldToBalance;
    signal input amount;
    signal input newFromBalance;
    signal input newToBalance;

    component transfer = Transfer(BALANCE_BITS);
    transfer.oldFromBalance <== oldFromBalance;
    transfer.oldToBalance <== oldToBalance;
    transfer.amount <== amount;
    transfer.newFromBalance <== newFromBalance;
    transfer.newToBalance <== newToBalance;
}

component main = Main(32);
