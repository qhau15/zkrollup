import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const snarkjsCli = join("node_modules", "snarkjs", "cli.js");

function run(args) {
  const result = spawnSync(process.execPath, [snarkjsCli, ...args], {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(result.error);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await mkdir("output", { recursive: true });

const wasmPath = "build/transfer_js/transfer.wasm";
const zkeyPath = "build/transfer_final.zkey";
const verificationKeyPath = "output/verification_key.json";

if (!existsSync(wasmPath)) {
  throw new Error("Missing transfer.wasm. Run npm run compile:circuit first.");
}

if (!existsSync(zkeyPath) || !existsSync(verificationKeyPath)) {
  throw new Error("Missing zkey or verification key. Run npm run setup:zk first.");
}

run(["groth16", "fullprove", "input/input.json", wasmPath, zkeyPath, "output/proof.json", "output/public.json"]);
run(["groth16", "verify", verificationKeyPath, "output/public.json", "output/proof.json"]);

console.log("Proof generated and verified.");
console.log("Generated output/proof.json and output/public.json.");
