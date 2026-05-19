import { readFile } from "node:fs/promises";
import { network } from "hardhat";

const { ethers } = await network.create();
const deployment = JSON.parse(await readFile("output/deployment.json", "utf8"));
const batch = JSON.parse(await readFile("output/batch.json", "utf8"));

const proof = ethers.toUtf8Bytes("mock-valid-proof");
const publicSignals = [batch.oldStateRoot, batch.newStateRoot, batch.batchHash];

const verifier = await ethers.getContractAt("MockVerifier", deployment.verifier);
const rollup = await ethers.getContractAt("MiniRollup", deployment.rollup);

if (await ethers.provider.getCode(deployment.rollup) === "0x") {
  throw new Error(
    "MiniRollup is not deployed on this network. Run a local node and use: npm run deploy -- --network localhost, then npm run submit:batch -- --network localhost. For a one-command demo, run: npm run demo",
  );
}

await (await verifier.setExpected(proof, publicSignals)).wait();

console.log(`Old state root: ${await rollup.stateRoot()}`);

const tx = await rollup.submitBatch(
  proof,
  batch.oldStateRoot,
  batch.newStateRoot,
  batch.batchHash,
);
await tx.wait();

console.log("Proof verified successfully.");
console.log(`New state root: ${await rollup.stateRoot()}`);
