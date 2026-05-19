import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { network } from "hardhat";

const snarkjsCli = join("node_modules", "snarkjs", "cli.js");
const { ethers } = await network.create();

if (!existsSync("output/proof.json") || !existsSync("output/public.json")) {
  throw new Error("Missing proof/public files. Run npm run generate:proof first.");
}

const calldataResult = spawnSync(
  process.execPath,
  [snarkjsCli, "zkey", "export", "soliditycalldata", "output/public.json", "output/proof.json"],
  { encoding: "utf8", shell: false },
);

if (calldataResult.status !== 0) {
  console.error(calldataResult.stderr);
  process.exit(calldataResult.status ?? 1);
}

const calldata = JSON.parse(`[${calldataResult.stdout.trim()}]`);
const [a, b, c, publicSignals] = calldata;

const TransferVerifier = await ethers.getContractFactory("Groth16Verifier");
const verifier = await TransferVerifier.deploy();
await verifier.waitForDeployment();

const ok = await verifier.verifyProof(a, b, c, publicSignals);

console.log(`TransferVerifier: ${await verifier.getAddress()}`);
console.log(`On-chain proof verification: ${ok ? "valid" : "invalid"}`);

if (!ok) {
  process.exit(1);
}
