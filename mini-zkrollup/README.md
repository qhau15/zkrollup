# Mini zkRollup

Prototype zkRollup nhá» mÃ´ phá»ng luá»“ng giao dá»‹ch token vá»›i zero-knowledge proof.

## Má»¥c tiÃªu

Dá»± Ã¡n nÃ y giÃºp báº¡n hiá»ƒu cÃ¡c pháº§n sau:

- Kiáº¿n trÃºc zkRollup nhá»: state root, batch, proof.
- Off-chain proof generation vá»›i Circom vÃ  snarkjs.
- On-chain verification trong Solidity.
- Sá»­ dá»¥ng Hardhat Ä‘á»ƒ biÃªn dá»‹ch, deploy, test vÃ  cháº¡y script.

## Requirements

- Node.js 18+ (hoáº·c tÆ°Æ¡ng thÃ­ch vá»›i cÃ¡c package trong `package.json`)
- npm
- Hardhat
- Circom 2 (náº¿u dÃ¹ng script compile circuit trá»±c tiáº¿p)
- snarkjs

> Gá»£i Ã½: náº¿u chÆ°a cÃ i Circom, báº¡n váº«n cÃ³ thá»ƒ dÃ¹ng pháº§n demo `MockVerifier` Ä‘á»ƒ hiá»ƒu luá»“ng contract.

## Kiáº¿n thá»©c nÃªn náº¯m trÆ°á»›c

- Solidity cÆ¡ báº£n: contract, state variables, struct, mapping, event.
- Hardhat: project config, script, network local.
- Merkle tree vÃ  hash Poseidon.
- zk-SNARKs: circuit, witness, proof, public input, trusted setup.
- Groth16 verification on-chain.

## Cáº¥u trÃºc thÆ° má»¥c

- `contracts/`
  - `MiniRollup.sol`: contract chÃ­nh, lÆ°u `stateRoot`, nháº­n proof vÃ  cáº­p nháº­t tráº¡ng thÃ¡i.
  - `MockVerifier.sol`: verifier giáº£ dÃ¹ng trong demo nhanh.
  - `RollupVerifier.sol`: verifier Groth16 tháº­t do snarkjs generate.
  - `RollupVerifierAdapter.sol`: adapter giÃºp `MiniRollup` gá»i verifier tháº­t.
  - `TransferVerifier.sol`: verifier riÃªng cho circuit chuyá»ƒn token.

- `circuits/`
  - `transfer.circom`: circuit kiá»ƒm tra 1 giao dá»‹ch token.
  - `rollup_batch.circom`: circuit batch chá»©ng minh 2 giao dá»‹ch vÃ  cáº­p nháº­t `oldStateRoot`, `newStateRoot`, `batchHash`.
  - `batch_with_roots.circom`: tham kháº£o Merkle path chi tiáº¿t hÆ¡n, lÃ m máº«u thÃªm.

- `scripts/`
  - `generate-batch.js`: táº¡o batch dá»¯ liá»‡u vÃ  Merkle tree demo.
  - `generate-rollup-input.js`: sinh input cho circuit rollup tá»« batch.
  - `compile-circuit.js`, `compile- rollup-circuit.js`: compile circuit báº±ng circom.
  - `setup-zk.js`, `setup-rollup-zk.js`: thá»±c hiá»‡n trusted setup (`ptau`, `zkey`).
  - `generate-proof.js`, `generate-rollup-proof.js`: táº¡o witness vÃ  proof báº±ng snarkjs.
  - `demo.js`: cháº¡y flow on-chain vá»›i `MockVerifier`.
  - `demo-real-rollup.js`: cháº¡y flow on-chain vá»›i proof Groth16 tháº­t.
  - `deploy.js`: deploy contract tá»›i local network.
  - `submit-batch.js`: submit batch lÃªn contract Ä‘Ã£ deploy.
  - `verify-transfer-onchain.js`: verify proof transfer trÃªn blockchain.

- `test/`: test suite Hardhat.
- `build/`: chá»©a artifacts, ptau, zkey, r1cs.
- `output/`: chá»©a proof, public input, and other generated files.
- `artifacts/`: Hardhat compile output.

## Luá»“ng hoáº¡t Ä‘á»™ng chÃ­nh

### 1. Táº¡o dá»¯ liá»‡u input off-chain

- `generate-batch.js`: táº¡o batch dá»¯ liá»‡u demo vÃ  Merkle tree.
- `generate-rollup-input.js`: táº¡o input phÃ¹ há»£p cho circuit batch.

### 2. Compile circuit vÃ  chuáº©n bá»‹ trusted setup

- `compile:circuit`: compile `transfer.circom`.
- `compile:rollup-circuit`: compile `rollup_batch.circom`.
- `setup:zk`: táº¡o `ptau` vÃ  `zkey` cho circuit transfer.
- `setup:rollup-zk`: táº¡o `ptau` vÃ  `zkey` cho circuit batch.

### 3. Sinh proof off-chain

- `generate-proof`: táº¡o proof cho `transfer.circom`.
- `generate-rollup-proof`: táº¡o proof cho `rollup_batch.circom`.

Káº¿t quáº£ náº±m trong `output/` vÃ  `build/`.

### 4. Verify proof on-chain

- `demo.js`: cháº¡y contract vá»›i `MockVerifier` Ä‘á»ƒ kiá»ƒm tra luá»“ng logic.
- `demo-real-rollup.js`: verify proof tháº­t vÃ  cáº­p nháº­t `stateRoot`.
- `verify-transfer-onchain.js`: kiá»ƒm tra proof transfer trÃªn chain.

### 5. Cáº­p nháº­t state root

- Náº¿u proof há»£p lá»‡, `MiniRollup.sol` cáº­p nháº­t `stateRoot` má»›i.
- Contract chá»‰ cháº¥p nháº­n batch khi `oldStateRoot` vÃ  `newStateRoot` khá»›p input public.

## Start nhanh

```bash
cd mini-zkrollup
npm install
npm run generate:batch
npm test
npm run demo
```

### Cháº¡y toÃ n bá»™ proof tháº­t

```bash
npm run compile:rollup-circuit
npm run setup:rollup-zk
npm run generate:rollup-proof
npm run demo:real-rollup
```

### Deploy local vÃ  submit batch

```bash
npx hardhat node
npm run deploy -- --network localhost
npm run submit:batch -- --network localhost
```

## HÆ°á»›ng Ä‘á»c source Ä‘á» xuáº¥t

1. `contracts/MiniRollup.sol` Ä‘á»ƒ hiá»ƒu core state vÃ  verification flow.
2. `contracts/MockVerifier.sol` Ä‘á»ƒ hiá»ƒu mock verification.
3. `circuits/rollup_batch.circom` Ä‘á»ƒ hiá»ƒu logic proof batch.
4. `scripts/generate-rollup-input.js` vÃ  `generate-rollup-proof.js` Ä‘á»ƒ biáº¿t input vÃ  proof flow.
5. `scripts/demo-real-rollup.js` Ä‘á»ƒ hiá»ƒu cÃ¡ch proof on-chain thá»±c sá»±.

## LÆ°u Ã½

- `npm run demo` dÃ¹ng `MockVerifier` nÃªn cháº¡y nhanh vÃ  dá»… debug.
- `npm run demo:real-rollup` cháº¡y proof tháº­t, cÃ³ thá»ƒ cháº­m hÆ¡n vÃ¬ snarkjs vÃ  trusted setup.
- CÃ¡c file `output/public.json` vÃ  `output/proof.json` lÃ  káº¿t quáº£ Ä‘áº§u ra quan trá»ng Ä‘á»ƒ verify.

## Náº¿u muá»‘n hiá»ƒu sÃ¢u hÆ¡n

- Má»Ÿ `mini-zkrollup/lib/merkle.js` vÃ  `lib/poseidon.js` Ä‘á»ƒ xem cÃ¡ch tÃ­nh hash vÃ  Merkle tree.
- Xem `batch_with_roots.circom` nhÆ° máº«u Ä‘á»ƒ má»Ÿ rá»™ng circuit Merkle path.
- Äá»c test `test/mini-rollup.test.js` vÃ  `test/real-rollup-proof.test.js` Ä‘á»ƒ hiá»ƒu ká»³ vá»ng cá»§a contract.

## Báº¡n cáº§n há»c gÃ¬ trÆ°á»›c khi Ä‘á»c source nÃ y

Náº¿u báº¡n lÃ  ngÆ°á»i má»›i hoÃ n toÃ n, nÃªn há»c theo thá»© tá»± sau Ä‘á»ƒ hiá»ƒu nhanh nháº¥t:

1. **Blockchain cÄƒn báº£n**
   - Account, transaction, gas, state.
   - CÃ¡ch contract lÆ°u vÃ  cáº­p nháº­t tráº¡ng thÃ¡i on-chain.

2. **Solidity cÆ¡ báº£n**
   - CÃº phÃ¡p contract, `mapping`, `event`, `require`, interface.
   - CÃ¡ch Ä‘á»c cÃ¡c file trong `contracts/` (Ä‘áº·c biá»‡t `MiniRollup.sol`).

3. **Hardhat + Node.js workflow**
   - `npm install`, cháº¡y script, compile/test/deploy.
   - Hiá»ƒu `package.json`, `hardhat.config.js`, thÆ° má»¥c `artifacts/`.

4. **Zero-Knowledge Proof (má»©c nháº­p mÃ´n)**
   - KhÃ¡i niá»‡m witness, constraint, proving key, verifying key.
   - Groth16: proof + public inputs + verifier contract.

5. **Circom cÆ¡ báº£n**
   - `signal`, `component`, `template`, rÃ ng buá»™c `===`, gÃ¡n `<==`.
   - Äá»c Ä‘Æ°á»£c `circuits/transfer.circom` vÃ  `circuits/rollup_batch.circom`.

6. **circomlib gadgets**
   - `Poseidon`, `Num2Bits`, `IsEqual`, `LessThan`.
   - VÃ¬ sao há»‡ nÃ y dÃ¹ng Poseidon thay vÃ¬ SHA trong circuit.

7. **Finite field arithmetic**
   - Má»i phÃ©p toÃ¡n trong circuit cháº¡y trÃªn trÆ°á»ng há»¯u háº¡n (mod field).
   - LÃ½ do cáº§n giá»›i háº¡n bit-size báº±ng `Num2Bits`.

8. **Merkle tree + Rollup logic**
   - Leaf/root, cÃ¡ch tÃ­nh root má»›i sau batch giao dá»‹ch.
   - Luá»“ng tá»•ng: `oldStateRoot -> proof -> verify -> newStateRoot`.

### Lá»™ trÃ¬nh há»c nhanh 7 ngÃ y (gá»£i Ã½)

- **NgÃ y 1:** Node.js, npm, Hardhat cÆ¡ báº£n.
- **NgÃ y 2:** Solidity nháº­p mÃ´n, viáº¿t 1 contract Ä‘Æ¡n giáº£n.
- **NgÃ y 3:** KhÃ¡i niá»‡m ZK/SNARK (chÆ°a cáº§n code).
- **NgÃ y 4:** Circom syntax + cháº¡y circuit nhá».
- **NgÃ y 5:** Äá»c vÃ  cháº¡y `transfer.circom`.
- **NgÃ y 6:** Äá»c vÃ  trace `rollup_batch.circom`.
- **NgÃ y 7:** Cháº¡y full flow proof + verify on-chain trong repo nÃ y.

## Checklist há»c vÃ  cháº¡y dá»± Ã¡n

### 1) Checklist kiáº¿n thá»©c ná»n

- [ ] Hiá»ƒu blockchain cÆ¡ báº£n: account, tx, gas, state.
- [ ] Äá»c Ä‘Æ°á»£c Solidity cÆ¡ báº£n: `contract`, `mapping`, `event`, `require`.
- [ ] Biáº¿t Hardhat flow: `compile`, `test`, `deploy`.
- [ ] Náº¯m ZK/SNARK nháº­p mÃ´n: witness, proof, public inputs.
- [ ] Äá»c Ä‘Æ°á»£c Circom: `signal`, `template`, `component`, `===`, `<==`.
- [ ] Hiá»ƒu Merkle tree: leaf, root, update root.
- [ ] Biáº¿t Poseidon hash dÃ¹ng trong circuit.

### 2) Checklist cháº¡y ká»¹ thuáº­t

- [ ] `npm install`
- [ ] `npm test`
- [ ] `npm run generate:batch`
- [ ] `npm run generate:rollup-input`
- [ ] `npm run compile:rollup-circuit`
- [ ] `npm run setup:rollup-zk`
- [ ] `npm run generate:rollup-proof`
- [ ] `npm run demo:real-rollup`

### 3) Checklist Ä‘á»c source theo thá»© tá»±

- [ ] `contracts/MiniRollup.sol`
- [ ] `circuits/transfer.circom`
- [ ] `circuits/rollup_batch.circom`
- [ ] `scripts/generate-rollup-input.js`
- [ ] `scripts/generate-rollup-proof.js`
- [ ] `scripts/demo-real-rollup.js`
- [ ] `test/real-rollup-proof.test.js`

## Diagram luá»“ng há»‡ thá»‘ng

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

