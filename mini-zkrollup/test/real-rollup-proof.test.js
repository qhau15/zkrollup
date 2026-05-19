import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const snarkjsCli = join("node_modules", "snarkjs", "cli.js");

function loadSolidityCalldata() {
  if (!existsSync("output/rollup_proof.json") || !existsSync("output/rollup_public.json")) {
    throw new Error("Missing rollup proof/public files. Run npm run generate:rollup-proof first.");
  }

  const result = spawnSync(
    process.execPath,
    [snarkjsCli, "zkey", "export", "soliditycalldata", "output/rollup_public.json", "output/rollup_proof.json"],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || "Failed to export solidity calldata");
  }

  const [a, b, c, publicSignals] = JSON.parse(`[${result.stdout.trim()}]`);
  const proof = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]"],
    [a, b, c],
  );

  return { a, b, c, proof, publicSignals };
}

async function expectRevert(promise, expectedErrorName) {
  try {
    await promise;
  } catch (error) {
    expect(error.message).to.include(expectedErrorName);
    return;
  }

  throw new Error(`Expected transaction to revert with ${expectedErrorName}`);
}

describe("Real rollup Groth16 proof", function () {
  async function deployFixture() {
    const { proof, publicSignals } = loadSolidityCalldata();
    const [oldRoot, newRoot, batchHash] = publicSignals;

    const RollupVerifier = await ethers.getContractFactory("RollupGroth16Verifier");
    const groth16Verifier = await RollupVerifier.deploy();
    await groth16Verifier.waitForDeployment();

    const Adapter = await ethers.getContractFactory("RollupVerifierAdapter");
    const adapter = await Adapter.deploy(await groth16Verifier.getAddress());
    await adapter.waitForDeployment();

    const MiniRollup = await ethers.getContractFactory("MiniRollup");
    const rollup = await MiniRollup.deploy(oldRoot, await adapter.getAddress());
    await rollup.waitForDeployment();

    return { proof, oldRoot, newRoot, batchHash, groth16Verifier, adapter, rollup };
  }

  it("verifies the generated rollup proof directly on-chain", async function () {
    const { a, b, c, publicSignals } = loadSolidityCalldata();

    const RollupVerifier = await ethers.getContractFactory("RollupGroth16Verifier");
    const verifier = await RollupVerifier.deploy();
    await verifier.waitForDeployment();

    expect(await verifier.verifyProof(a, b, c, publicSignals)).to.equal(true);
  });

  it("accepts a real rollup proof and updates stateRoot", async function () {
    const { proof, oldRoot, newRoot, batchHash, rollup } = await deployFixture();

    await rollup.submitBatch(proof, oldRoot, newRoot, batchHash);

    expect(await rollup.stateRoot()).to.equal(BigInt(newRoot));
  });

  it("rejects a real proof when newRoot public input is changed", async function () {
    const { proof, oldRoot, newRoot, batchHash, rollup } = await deployFixture();

    await expectRevert(
      rollup.submitBatch(proof, oldRoot, BigInt(newRoot) + 1n, batchHash),
      "InvalidProof",
    );
  });

  it("rejects replaying the same real proof after stateRoot changed", async function () {
    const { proof, oldRoot, newRoot, batchHash, rollup } = await deployFixture();

    await rollup.submitBatch(proof, oldRoot, newRoot, batchHash);

    await expectRevert(
      rollup.submitBatch(proof, oldRoot, newRoot, batchHash),
      "InvalidOldRoot",
    );
  });

  it("matches the public output batch JSON", async function () {
    const { publicSignals } = loadSolidityCalldata();
    const batch = JSON.parse(await readFile("output/batch.json", "utf8"));

    expect(BigInt(publicSignals[0])).to.equal(BigInt(batch.oldStateRoot));
    expect(BigInt(publicSignals[1])).to.equal(BigInt(batch.newStateRoot));
    expect(BigInt(publicSignals[2])).to.equal(BigInt(batch.batchHash));
  });
});
