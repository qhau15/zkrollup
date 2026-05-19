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

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await mkdir("output", { recursive: true });

const wasmPath = "build/rollup_batch_js/rollup_batch.wasm";
const zkeyPath = "build/rollup_batch_final.zkey";
const verificationKeyPath = "output/rollup_verification_key.json";

if (!existsSync("input/rollup_input.json")) {
  throw new Error("Missing input/rollup_input.json. Run npm run generate:rollup-input first.");
}

if (!existsSync(wasmPath)) {
  throw new Error("Missing rollup_batch.wasm. Run npm run compile:rollup-circuit first.");
}

if (!existsSync(zkeyPath) || !existsSync(verificationKeyPath)) {
  throw new Error("Missing rollup zkey or verification key. Run npm run setup:rollup-zk first.");
}

run([
  "groth16",
  "fullprove",
  "input/rollup_input.json",
  wasmPath,
  zkeyPath,
  "output/rollup_proof.json",
  "output/rollup_public.json",
]);
run(["groth16", "verify", verificationKeyPath, "output/rollup_public.json", "output/rollup_proof.json"]);

console.log("Rollup proof generated and verified.");
console.log("Generated output/rollup_proof.json and output/rollup_public.json.");
