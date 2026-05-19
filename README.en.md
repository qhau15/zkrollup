# zkrollup

A mini zkRollup prototype that demonstrates zk-SNARK-based token batch proving and on-chain verification.

Language:
- English: `README.en.md`
- Tiếng Việt: `README.vi.md`

This root README is the English default.

## Overview

This repository has two main parts:

- `mini-zkrollup/`: core source code (contracts, circuits, scripts, tests).
- `mini_zkrollup_plan.md`: project planning notes.

Operational goal:
- build off-chain batch transaction data,
- generate proofs with Circom/snarkjs,
- verify proofs in Solidity,
- update on-chain `stateRoot`.

## Main folder structure

- `mini-zkrollup/contracts/`: Solidity smart contracts.
- `mini-zkrollup/circuits/`: Circom circuits for transfer/batch.
- `mini-zkrollup/scripts/`: Node.js scripts for input/proof/demo/deploy.
- `mini-zkrollup/test/`: Hardhat tests.
- `mini-zkrollup/build/`: circuit artifacts, `ptau`, `zkey`, `r1cs`.
- `mini-zkrollup/output/`: generated proof + public inputs.

## Runtime flow

1. Install dependencies in `mini-zkrollup/`.
2. Generate batch data and rollup circuit input.
3. Compile circuits and run Groth16 setup.
4. Generate proof off-chain.
5. Submit proof to `MiniRollup.sol` for verifier checks.
6. If valid -> update `newStateRoot`; if invalid -> revert.

## Run checklist

- [ ] `cd mini-zkrollup`
- [ ] `npm install`
- [ ] `npm test`
- [ ] `npm run generate:batch`
- [ ] `npm run generate:rollup-input`
- [ ] `npm run compile:rollup-circuit`
- [ ] `npm run setup:rollup-zk`
- [ ] `npm run generate:rollup-proof`
- [ ] `npm run demo:real-rollup`

## System flow diagram

```mermaid
flowchart LR
  U[User tx list] --> B[Off-chain Batch Builder]
  B --> M[Merkle Tree Builder]
  M --> O[oldStateRoot]
  B --> I[Rollup Circuit Input]
  O --> I
  I --> C[Circom: rollup_batch.circom]
  C --> W[Witness]
  W --> P[snarkjs Groth16 Proof]
  P --> D[Hardhat Script demo-real-rollup.js]
  D --> S[MiniRollup.sol submitBatch]
  S --> V[Verifier Contract]
  V -->|valid| R[newStateRoot update]
  V -->|invalid| X[revert]
```

```mermaid
sequenceDiagram
  participant OP as Operator (off-chain)
  participant CC as Circom+snarkjs
  participant HH as Hardhat Script
  participant MR as MiniRollup.sol
  participant VF as Verifier

  OP->>OP: Build batch + compute old/new roots
  OP->>CC: Send circuit input
  CC-->>OP: Return proof + public inputs
  OP->>HH: Load proof/public.json
  HH->>MR: submitBatch(oldRoot,newRoot,batchHash,proof)
  MR->>VF: verifyProof(...)
  VF-->>MR: true/false
  MR-->>HH: success (update stateRoot) / revert
```

For learning prerequisites and study roadmap, see `mini-zkrollup/README.en.md` or `mini-zkrollup/README.vi.md`.
