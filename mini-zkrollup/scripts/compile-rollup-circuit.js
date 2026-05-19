import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const circomCommand = process.platform === "win32" && process.env.USERPROFILE
  ? join(process.env.USERPROFILE, ".cargo", "bin", "circom.exe")
  : "circom";
const fallbackCircomCommand = existsSync(circomCommand) ? circomCommand : "circom";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await mkdir("build", { recursive: true });

const circuitPath = "circuits/rollup_batch.circom";

if (!existsSync(circuitPath)) {
  throw new Error(`Missing circuit file: ${circuitPath}`);
}

const circomCheck = spawnSync(fallbackCircomCommand, ["--version"], {
  stdio: "ignore",
  shell: false,
});

if (circomCheck.status !== 0) {
  console.log("Circom compiler was not found in PATH.");
  console.log("Install Circom 2, then run: npm run compile:rollup-circuit");
  process.exit(0);
}

run(fallbackCircomCommand, [circuitPath, "--r1cs", "--wasm", "--sym", "-o", "build"]);
console.log("Rollup circuit compiled into build/.");
