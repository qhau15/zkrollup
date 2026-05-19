import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { network } from "hardhat";

const snarkjsCli = join("node_modules", "snarkjs", "cli.js");
const { ethers } = await network.create();

if (!existsSync("output/rollup_proof.json") || !existsSync("output/rollup_public.json")) {
  throw new Error("Missing rollup proof/public files. Run npm run generate:rollup-proof first.");
}

if (!existsSync("output/batch.json")) {
  throw new Error("Missing output/batch.json. Run npm run generate:rollup-input first.");
}

const calldataResult = spawnSync(
  process.execPath,
  [snarkjsCli, "zkey", "export", "soliditycalldata", "output/rollup_public.json", "output/rollup_proof.json"],
  { encoding: "utf8", shell: false },
);

if (calldataResult.status !== 0) {
  console.error(calldataResult.stderr);
  process.exit(calldataResult.status ?? 1);
}

const [a, b, c, publicSignals] = JSON.parse(`[${calldataResult.stdout.trim()}]`);
const [oldRoot, newRoot, batchHash] = publicSignals;
const proof = ethers.AbiCoder.defaultAbiCoder().encode(
  ["uint256[2]", "uint256[2][2]", "uint256[2]"],
  [a, b, c],
);

const batch = JSON.parse(await readFile("output/batch.json", "utf8"));

const RollupVerifier = await ethers.getContractFactory("RollupGroth16Verifier");
const groth16Verifier = await RollupVerifier.deploy();
await groth16Verifier.waitForDeployment();

const Adapter = await ethers.getContractFactory("RollupVerifierAdapter");
const adapter = await Adapter.deploy(await groth16Verifier.getAddress());
await adapter.waitForDeployment();

const MiniRollup = await ethers.getContractFactory("MiniRollup");
const rollup = await MiniRollup.deploy(oldRoot, await adapter.getAddress());
await rollup.waitForDeployment();

console.log("Real zkRollup batch demo");
console.log(`Groth16 verifier: ${await groth16Verifier.getAddress()}`);
console.log(`Verifier adapter: ${await adapter.getAddress()}`);
console.log(`MiniRollup: ${await rollup.getAddress()}`);
console.log(`Initial state root: ${await rollup.stateRoot()}`);
console.log(`Batch hash: ${batchHash}`);
console.log(`Transactions: ${JSON.stringify(batch.transactions)}`);

await (await rollup.submitBatch(proof, oldRoot, newRoot, batchHash)).wait();

console.log("Groth16 proof verified on-chain.");
console.log(`Updated state root: ${await rollup.stateRoot()}`);
