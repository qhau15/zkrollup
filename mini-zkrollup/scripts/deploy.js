import { writeFile, mkdir } from "node:fs/promises";
import { network } from "hardhat";
import { buildDemoBatch } from "../lib/batch.js";

const { ethers } = await network.create();
const batch = await buildDemoBatch();

const MockVerifier = await ethers.getContractFactory("MockVerifier");
const verifier = await MockVerifier.deploy();
await verifier.waitForDeployment();

const MiniRollup = await ethers.getContractFactory("MiniRollup");
const rollup = await MiniRollup.deploy(batch.oldStateRoot, await verifier.getAddress());
await rollup.waitForDeployment();

const deployment = {
  verifier: await verifier.getAddress(),
  rollup: await rollup.getAddress(),
  initialStateRoot: batch.oldStateRoot,
};

await mkdir("output", { recursive: true });
await writeFile("output/deployment.json", `${JSON.stringify(deployment, null, 2)}\n`);

console.log("Contracts deployed.");
console.log(`MockVerifier: ${deployment.verifier}`);
console.log(`MiniRollup: ${deployment.rollup}`);
console.log(`Initial state root: ${deployment.initialStateRoot}`);
