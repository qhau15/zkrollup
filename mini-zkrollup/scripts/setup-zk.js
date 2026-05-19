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

await mkdir("build", { recursive: true });
await mkdir("output", { recursive: true });

if (!existsSync("build/transfer.r1cs")) {
  throw new Error("Missing build/transfer.r1cs. Run npm run compile:circuit first.");
}

if (!existsSync("build/pot12_final.ptau")) {
  run(["powersoftau", "new", "bn128", "12", "build/pot12_0000.ptau", "-v"]);
  run([
    "powersoftau",
    "contribute",
    "build/pot12_0000.ptau",
    "build/pot12_0001.ptau",
    "--name=First contribution",
    "-v",
    "-e=mini-zkrollup-demo",
  ]);
  run(["powersoftau", "prepare", "phase2", "build/pot12_0001.ptau", "build/pot12_final.ptau", "-v"]);
}

run(["groth16", "setup", "build/transfer.r1cs", "build/pot12_final.ptau", "build/transfer_0000.zkey"]);
run([
  "zkey",
  "contribute",
  "build/transfer_0000.zkey",
  "build/transfer_final.zkey",
  "--name=Second contribution",
  "-v",
  "-e=mini-zkrollup-transfer",
]);
run(["zkey", "export", "verificationkey", "build/transfer_final.zkey", "output/verification_key.json"]);
run(["zkey", "export", "solidityverifier", "build/transfer_final.zkey", "contracts/TransferVerifier.sol"]);

console.log("ZK setup complete.");
console.log("Generated output/verification_key.json and contracts/TransferVerifier.sol.");
