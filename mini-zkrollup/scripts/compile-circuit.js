import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await mkdir("build", { recursive: true });

const circuitPath = "circuits/transfer.circom";

if (!existsSync(circuitPath)) {
  throw new Error(`Missing circuit file: ${circuitPath}`);
}

const circomCheck = spawnSync("circom", ["--version"], {
  stdio: "ignore",
  shell: process.platform === "win32",
});

if (circomCheck.status !== 0) {
  console.log("Circom compiler was not found in PATH.");
  console.log("Install Circom 2, then run: npm run compile:circuit");
  console.log("Project contracts/scripts can still be tested with: npm test");
  process.exit(0);
}

run("circom", [circuitPath, "--r1cs", "--wasm", "--sym", "-o", "build"]);
console.log("Circuit compiled into build/.");
console.log("Next: run snarkjs setup/prove commands when ready.");
