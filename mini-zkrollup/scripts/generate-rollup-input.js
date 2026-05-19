import { mkdir, writeFile } from "node:fs/promises";
import { buildDemoBatch } from "../lib/batch.js";

const batch = await buildDemoBatch();

const input = {
  oldStateRoot: batch.oldStateRoot,
  newStateRoot: batch.newStateRoot,
  batchHash: batch.batchHash,
  oldBalances: batch.oldBalances,
  from: batch.transactions.map((transaction) => transaction.from.toString()),
  to: batch.transactions.map((transaction) => transaction.to.toString()),
  amount: batch.transactions.map((transaction) => transaction.amount),
};

await mkdir("input", { recursive: true });
await mkdir("output", { recursive: true });
await writeFile("input/rollup_input.json", `${JSON.stringify(input, null, 2)}\n`);
await writeFile("output/batch.json", `${JSON.stringify(batch, null, 2)}\n`);

console.log("Rollup circuit input generated.");
console.log(`Old state root: ${batch.oldStateRoot}`);
console.log(`New state root: ${batch.newStateRoot}`);
console.log(`Batch hash: ${batch.batchHash}`);
