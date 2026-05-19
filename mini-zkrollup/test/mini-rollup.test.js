import { expect } from "chai";
import { network } from "hardhat";
import { buildDemoBatch } from "../lib/batch.js";

const { ethers } = await network.create();

async function expectRevert(promise, expectedErrorName) {
  try {
    await promise;
  } catch (error) {
    expect(error.message).to.include(expectedErrorName);
    return;
  }

  throw new Error(`Expected transaction to revert with ${expectedErrorName}`);
}

describe("MiniRollup", function () {
  async function deployFixture() {
    const batch = await buildDemoBatch();

    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    const verifier = await MockVerifier.deploy();
    await verifier.waitForDeployment();

    const MiniRollup = await ethers.getContractFactory("MiniRollup");
    const rollup = await MiniRollup.deploy(batch.oldStateRoot, await verifier.getAddress());
    await rollup.waitForDeployment();

    const proof = ethers.toUtf8Bytes("mock-valid-proof");
    const publicSignals = [batch.oldStateRoot, batch.newStateRoot, batch.batchHash];

    return { batch, verifier, rollup, proof, publicSignals };
  }

  it("stores the initial state root", async function () {
    const { batch, rollup } = await deployFixture();

    expect(await rollup.stateRoot()).to.equal(batch.oldStateRoot);
  });

  it("accepts a valid batch and updates stateRoot", async function () {
    const { batch, verifier, rollup, proof, publicSignals } = await deployFixture();

    await verifier.setExpected(proof, publicSignals);
    const tx = await rollup.submitBatch(proof, batch.oldStateRoot, batch.newStateRoot, batch.batchHash);
    const receipt = await tx.wait();

    expect(await rollup.stateRoot()).to.equal(batch.newStateRoot);
    expect(receipt.logs.length).to.equal(1);
  });

  it("rejects a batch with a stale old root", async function () {
    const { batch, verifier, rollup, proof, publicSignals } = await deployFixture();

    await verifier.setExpected(proof, publicSignals);

    await expectRevert(
      rollup.submitBatch(proof, 999n, batch.newStateRoot, batch.batchHash),
      "InvalidOldRoot",
    );
  });

  it("rejects a proof when public input is changed", async function () {
    const { batch, verifier, rollup, proof, publicSignals } = await deployFixture();

    await verifier.setExpected(proof, publicSignals);

    await expectRevert(
      rollup.submitBatch(proof, batch.oldStateRoot, BigInt(batch.newStateRoot) + 1n, batch.batchHash),
      "InvalidProof",
    );
  });

  it("rejects replaying a previously accepted batch", async function () {
    const { batch, verifier, rollup, proof, publicSignals } = await deployFixture();

    await verifier.setExpected(proof, publicSignals);
    await rollup.submitBatch(proof, batch.oldStateRoot, batch.newStateRoot, batch.batchHash);

    await expectRevert(
      rollup.submitBatch(proof, batch.oldStateRoot, batch.newStateRoot, batch.batchHash),
      "InvalidOldRoot",
    );
  });
});
