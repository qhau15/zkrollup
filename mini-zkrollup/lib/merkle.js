import { poseidonHash, toDecimalString } from "./poseidon.js";

export async function accountLeaf(accountId, balance) {
  return poseidonHash([accountId, balance]);
}

export async function buildAccountTree(balances) {
  const leaves = [];

  for (let accountId = 0; accountId < balances.length; accountId += 1) {
    leaves.push(await accountLeaf(accountId, balances[accountId]));
  }

  const levels = [leaves];
  let current = leaves;

  while (current.length > 1) {
    const next = [];

    for (let i = 0; i < current.length; i += 2) {
      next.push(await poseidonHash([current[i], current[i + 1]]));
    }

    levels.push(next);
    current = next;
  }

  return {
    levels,
    root: levels[levels.length - 1][0],
  };
}

export function getMerklePath(tree, leafIndex) {
  const path = [];
  const indices = [];
  let index = leafIndex;

  for (let level = 0; level < tree.levels.length - 1; level += 1) {
    const siblingIndex = index ^ 1;
    path.push(tree.levels[level][siblingIndex]);
    indices.push(index % 2);
    index = Math.floor(index / 2);
  }

  return { path, indices };
}

export async function calculateRootFromPath(leaf, path, indices) {
  let current = BigInt(leaf);

  for (let i = 0; i < path.length; i += 1) {
    const sibling = BigInt(path[i]);
    current = indices[i] === 0
      ? await poseidonHash([current, sibling])
      : await poseidonHash([sibling, current]);
  }

  return current;
}

export async function hashTransaction(transaction) {
  return poseidonHash([transaction.from, transaction.to, transaction.amount]);
}

export async function hashBatch(transactions) {
  const txHashes = [];

  for (const transaction of transactions) {
    txHashes.push(await hashTransaction(transaction));
  }

  if (txHashes.length === 1) {
    return txHashes[0];
  }

  let current = txHashes;
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const right = current[i + 1] ?? 0n;
      next.push(await poseidonHash([current[i], right]));
    }
    current = next;
  }

  return current[0];
}

export function stringifyTreeValue(value) {
  return toDecimalString(value);
}
