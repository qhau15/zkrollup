import { mkdir, writeFile } from "node:fs/promises";
import { buildDemoBatch } from "../lib/batch.js";

const batch = await buildDemoBatch();

await mkdir("output", { recursive: true });
await writeFile("output/batch.json", `${JSON.stringify(batch, null, 2)}\n`);
await writeFile("output/public.json", `${JSON.stringify({
  oldStateRoot: batch.oldStateRoot,
  newStateRoot: batch.newStateRoot,
  batchHash: batch.batchHash,
}, null, 2)}\n`);

console.log("Demo batch generated.");
console.log(`Old state root: ${batch.oldStateRoot}`);
console.log(`New state root: ${batch.newStateRoot}`);
console.log(`Batch hash: ${batch.batchHash}`);
