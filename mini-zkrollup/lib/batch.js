import { buildAccountTree, getMerklePath, hashBatch, stringifyTreeValue } from "./merkle.js";

export const ACCOUNT_COUNT = 4;
export const BATCH_SIZE = 2;
export const TREE_DEPTH = 2;

export const initialBalances = [100n, 50n, 20n, 10n];

export const demoTransactions = [
  { from: 0, to: 1, amount: 10n },
  { from: 1, to: 2, amount: 5n },
];

export function applyTransactions(balances, transactions) {
  const nextBalances = [...balances];

  for (const transaction of transactions) {
    const amount = BigInt(transaction.amount);

    if (transaction.from < 0 || transaction.from >= nextBalances.length) {
      throw new Error(`Invalid from account: ${transaction.from}`);
    }

    if (transaction.to < 0 || transaction.to >= nextBalances.length) {
      throw new Error(`Invalid to account: ${transaction.to}`);
    }

    if (nextBalances[transaction.from] < amount) {
      throw new Error(`Insufficient balance for account ${transaction.from}`);
    }

    nextBalances[transaction.from] -= amount;
    nextBalances[transaction.to] += amount;
  }

  return nextBalances;
}

export async function buildDemoBatch() {
  const oldTree = await buildAccountTree(initialBalances);
  const newBalances = applyTransactions(initialBalances, demoTransactions);
  const newTree = await buildAccountTree(newBalances);
  const batchHash = await hashBatch(demoTransactions);

  const merkleWitnesses = demoTransactions.map((transaction) => ({
    from: getMerklePath(oldTree, transaction.from),
    to: getMerklePath(oldTree, transaction.to),
  }));

  return {
    constants: {
      ACCOUNT_COUNT,
      BATCH_SIZE,
      TREE_DEPTH,
    },
    oldBalances: initialBalances.map((value) => value.toString()),
    newBalances: newBalances.map((value) => value.toString()),
    transactions: demoTransactions.map((transaction) => ({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount.toString(),
    })),
    oldStateRoot: stringifyTreeValue(oldTree.root),
    newStateRoot: stringifyTreeValue(newTree.root),
    batchHash: stringifyTreeValue(batchHash),
    merkleWitnesses: merkleWitnesses.map((witness) => ({
      from: {
        path: witness.from.path.map(stringifyTreeValue),
        indices: witness.from.indices,
      },
      to: {
        path: witness.to.path.map(stringifyTreeValue),
        indices: witness.to.indices,
      },
    })),
  };
}
