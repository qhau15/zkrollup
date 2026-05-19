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

const proof = ethers.toUtf8Bytes("mock-valid-proof");
const publicSignals = [batch.oldStateRoot, batch.newStateRoot, batch.batchHash];

await (await verifier.setExpected(proof, publicSignals)).wait();

console.log("Demo Mini zkRollup");
console.log(`Verifier: ${await verifier.getAddress()}`);
console.log(`Rollup: ${await rollup.getAddress()}`);
console.log(`Old state root: ${await rollup.stateRoot()}`);
console.log(`Batch hash: ${batch.batchHash}`);

await (await rollup.submitBatch(proof, batch.oldStateRoot, batch.newStateRoot, batch.batchHash)).wait();

console.log("Proof verified successfully.");
console.log(`New state root: ${await rollup.stateRoot()}`);
