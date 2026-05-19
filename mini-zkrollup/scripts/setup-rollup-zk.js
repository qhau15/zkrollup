import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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

await mkdir("build", { recursive: true });
await mkdir("output", { recursive: true });

if (!existsSync("build/rollup_batch.r1cs")) {
  throw new Error("Missing build/rollup_batch.r1cs. Run npm run compile:rollup-circuit first.");
}

if (!existsSync("build/pot14_final.ptau")) {
  run(["powersoftau", "new", "bn128", "14", "build/pot14_0000.ptau", "-v"]);
  run([
    "powersoftau",
    "contribute",
    "build/pot14_0000.ptau",
    "build/pot14_0001.ptau",
    "--name=Rollup first contribution",
    "-v",
    "-e=mini-zkrollup-rollup-demo",
  ]);
  run(["powersoftau", "prepare", "phase2", "build/pot14_0001.ptau", "build/pot14_final.ptau", "-v"]);
}

run(["groth16", "setup", "build/rollup_batch.r1cs", "build/pot14_final.ptau", "build/rollup_batch_0000.zkey"]);
run([
  "zkey",
  "contribute",
  "build/rollup_batch_0000.zkey",
  "build/rollup_batch_final.zkey",
  "--name=Rollup second contribution",
  "-v",
  "-e=mini-zkrollup-rollup-batch",
]);
run(["zkey", "export", "verificationkey", "build/rollup_batch_final.zkey", "output/rollup_verification_key.json"]);
run(["zkey", "export", "solidityverifier", "build/rollup_batch_final.zkey", "contracts/RollupVerifier.sol"]);

const verifierSource = await readFile("contracts/RollupVerifier.sol", "utf8");
await writeFile(
  "contracts/RollupVerifier.sol",
  verifierSource.replace("contract Groth16Verifier", "contract RollupGroth16Verifier"),
);

console.log("Rollup ZK setup complete.");
console.log("Generated output/rollup_verification_key.json and contracts/RollupVerifier.sol.");
