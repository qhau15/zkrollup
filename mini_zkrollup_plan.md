# Đồ án: Mini zkRollup cho giao dịch token đơn giản

## 1. Mục tiêu đồ án

Xây dựng một mô hình **Mini zkRollup** ở mức prototype để mô phỏng cách zkRollup xử lý giao dịch ngoài chuỗi chính, tạo bằng chứng zero-knowledge và xác minh bằng smart contract.

Mục tiêu chính:

- Hiểu cơ chế hoạt động của zkRollup.
- Xây dựng được mô hình xử lý giao dịch off-chain.
- Gom nhiều giao dịch thành một batch.
- Cập nhật trạng thái tài khoản bằng Merkle root.
- Tạo zk-proof chứng minh batch được xử lý đúng.
- Xác minh zk-proof bằng Solidity smart contract.
- Cập nhật `stateRoot` mới nếu proof hợp lệ.

---

## 2. Phạm vi thực hiện

Đây là đồ án môn học, không xây dựng zkRollup production như zkSync, Starknet hay Scroll.

### 2.1. Phần sẽ thực hiện

| Thành phần | Mô tả |
|---|---|
| Account | Mỗi user có `accountId` và `balance` |
| Transaction | Giao dịch chuyển token từ account A sang account B |
| Batch | Gom nhiều transaction để xử lý một lần |
| State root | Đại diện trạng thái hệ thống bằng Merkle root |
| ZK circuit | Kiểm tra logic chuyển tiền hợp lệ |
| Proof | Tạo zk-proof bằng Circom/snarkjs |
| Verifier contract | Smart contract xác minh proof |
| Rollup contract | Lưu và cập nhật `stateRoot` |

### 2.2. Phần không thực hiện

| Thành phần | Lý do không làm |
|---|---|
| Full zkEVM | Quá phức tạp cho đồ án môn học |
| Smart contract trên Layer 2 | Không cần thiết cho prototype |
| Decentralized sequencer | Phạm vi quá rộng |
| Bridge ETH/ERC20 thật | Dễ phát sinh vấn đề bảo mật |
| Production-grade prover | Không cần cho demo |
| Data availability đầy đủ | Chỉ mô phỏng ở mức đơn giản |
| Chữ ký giao dịch đầy đủ | Có thể đưa vào hướng phát triển để tránh vượt phạm vi |
| Nonce chống replay đầy đủ | Có thể mô phỏng hoặc giải thích là giới hạn của prototype |

---

## 3. Kiến trúc hệ thống

```text
User
 |
 | 1. Submit transaction
 v
Off-chain Sequencer
 |
 | 2. Collect transactions into batch
 v
State Transition Engine
 |
 | 3. Update balances and calculate new state root
 v
ZK Prover
 |
 | 4. Generate zk-proof
 v
Ethereum Smart Contract
 |
 | 5. Verify proof and update stateRoot
 v
New Rollup State
```

---

## 4. Công nghệ sử dụng

| Mục đích | Công nghệ |
|---|---|
| Smart contract | Solidity |
| Local blockchain | Hardhat |
| ZK circuit | Circom |
| Proof generation | snarkjs |
| Backend script | Node.js / TypeScript |
| Merkle tree | JavaScript |
| Testing | Hardhat test |
| Frontend tùy chọn | React / HTML đơn giản |

Quy ước kỹ thuật nên dùng trong prototype:

- Hash trong Merkle tree và circuit: **Poseidon hash**.
- Public signal của circuit: dùng `uint256`/field element, không truyền trực tiếp kiểu `bytes32` như Solidity.
- Batch size: cố định, ví dụ `BATCH_SIZE = 2` hoặc `BATCH_SIZE = 4`.
- Balance và amount: giới hạn bit, ví dụ `uint32` hoặc `uint64`, để tránh lỗi do tính toán trong finite field.

---

## 5. Cấu trúc thư mục đề xuất

```text
mini-zkrollup/
│
├── circuits/
│   └── transfer.circom
│
├── contracts/
│   ├── Verifier.sol
│   └── MiniRollup.sol
│
├── scripts/
│   ├── compile-circuit.sh
│   ├── generate-proof.js
│   ├── deploy.js
│   └── submit-batch.js
│
├── test/
│   └── rollup.test.js
│
├── input/
│   └── input.json
│
├── output/
│   ├── proof.json
│   └── public.json
│
├── frontend/
│   └── index.html
│
├── package.json
├── hardhat.config.js
└── README.md
```

---

## 6. Luồng xử lý tổng thể

### Bước 1: Khởi tạo trạng thái ban đầu

Ví dụ hệ thống có 4 account:

```text
Account 0: balance = 100
Account 1: balance = 50
Account 2: balance = 20
Account 3: balance = 10
```

Mỗi account được biểu diễn bằng một leaf:

```text
leaf = hash(accountId, balance)
```

Từ đó tạo Merkle root ban đầu:

```text
oldStateRoot = MerkleRoot([
  hash(0, 100),
  hash(1, 50),
  hash(2, 20),
  hash(3, 10)
])
```

---

### Bước 2: User gửi giao dịch

Ví dụ batch gồm 2 giao dịch:

```json
[
  {
    "from": 0,
    "to": 1,
    "amount": 10
  },
  {
    "from": 1,
    "to": 2,
    "amount": 5
  }
]
```

---

### Bước 3: Sequencer gom giao dịch

Sequencer là thành phần off-chain có nhiệm vụ:

- Nhận transaction từ user.
- Kiểm tra định dạng transaction.
- Sắp xếp transaction.
- Gom nhiều transaction thành một batch.
- Gửi batch cho state transition engine xử lý.

Trong đồ án, sequencer có thể chỉ là một script JavaScript đơn giản.

---

### Bước 4: State transition engine xử lý batch

Trạng thái trước batch:

```text
Account 0: 100
Account 1: 50
Account 2: 20
Account 3: 10
```

Batch:

```text
Tx1: Account 0 chuyển 10 cho Account 1
Tx2: Account 1 chuyển 5 cho Account 2
```

Xử lý:

```text
Sau Tx1:
Account 0 = 100 - 10 = 90
Account 1 = 50 + 10 = 60

Sau Tx2:
Account 1 = 60 - 5 = 55
Account 2 = 20 + 5 = 25
```

Trạng thái sau batch:

```text
Account 0: 90
Account 1: 55
Account 2: 25
Account 3: 10
```

Tạo Merkle root mới:

```text
newStateRoot = MerkleRoot([
  hash(0, 90),
  hash(1, 55),
  hash(2, 25),
  hash(3, 10)
])
```

---

## 7. Logic cần chứng minh bằng ZK circuit

Circuit cần chứng minh rằng batch giao dịch được xử lý đúng.

### 7.1. Điều kiện với từng giao dịch

Với mỗi giao dịch:

```text
fromBalance >= amount
newFromBalance = oldFromBalance - amount
newToBalance = oldToBalance + amount
```

Nếu một account không đủ số dư, circuit phải reject.

Ví dụ hợp lệ:

```text
oldFromBalance = 100
oldToBalance = 50
amount = 10

newFromBalance = 90
newToBalance = 60
```

Ví dụ không hợp lệ:

```text
oldFromBalance = 5
amount = 10

Vì 5 < 10 nên transaction không hợp lệ.
```

---

### 7.2. Public input

Public input là dữ liệu được đưa lên smart contract để xác minh proof.

```text
oldStateRoot
newStateRoot
batchHash
```

Ý nghĩa:

| Public input | Ý nghĩa |
|---|---|
| `oldStateRoot` | Trạng thái trước khi xử lý batch |
| `newStateRoot` | Trạng thái sau khi xử lý batch |
| `batchHash` | Hash đại diện cho danh sách giao dịch |

---

### 7.3. Private input

Private input là dữ liệu dùng để tạo proof nhưng không cần công khai toàn bộ trên blockchain.

```text
oldBalances
newBalances
transactions
merkleProofs
```

Trong bản demo đơn giản, có thể chưa cần ẩn toàn bộ transaction. Tuy nhiên, báo cáo cần giải thích rằng zkRollup thực tế có thể dùng validity proof để chứng minh tính đúng đắn của state transition.

---

### 7.4. Kiểm chứng Merkle root trong circuit

Để proof thực sự chứng minh state transition của rollup, circuit không chỉ kiểm tra phép cộng/trừ balance mà còn cần kiểm tra quan hệ giữa account và state root.

Với mỗi giao dịch, circuit nên chứng minh:

```text
1. fromAccount cũ thuộc oldStateRoot.
2. toAccount cũ thuộc oldStateRoot.
3. Balance được cập nhật đúng sau giao dịch.
4. fromAccount mới và toAccount mới tạo ra root trung gian hoặc newStateRoot.
5. Sau toàn bộ batch, root cuối cùng bằng newStateRoot.
```

Input liên quan:

```text
fromAccountId
toAccountId
oldFromBalance
oldToBalance
newFromBalance
newToBalance
fromMerklePath
toMerklePath
fromMerklePathIndices
toMerklePathIndices
```

Lưu ý: nếu batch có nhiều giao dịch, trạng thái sau giao dịch trước phải là trạng thái đầu vào của giao dịch sau. Vì vậy circuit có thể dùng các root trung gian:

```text
oldStateRoot -> intermediateRoot1 -> intermediateRoot2 -> newStateRoot
```

---

### 7.5. Hash và batchHash

Trong circuit nên dùng Poseidon vì phù hợp với zk-SNARK hơn Keccak.

```text
leaf = Poseidon(accountId, balance)
parent = Poseidon(leftChild, rightChild)
batchHash = Poseidon(tx1Hash, tx2Hash, ...)
txHash = Poseidon(from, to, amount)
```

Trong Solidity, `stateRoot`, `newStateRoot` và `batchHash` có thể lưu dưới dạng `uint256` hoặc ép sang `bytes32` khi emit event. Khi gọi verifier do snarkjs sinh ra, public signals thường được truyền dưới dạng mảng `uint256[]`.

---

### 7.6. Batch size cố định

Circuit không thuận tiện cho danh sách giao dịch có độ dài động. Vì vậy prototype nên chọn batch size cố định.

Ví dụ:

```text
BATCH_SIZE = 2
TREE_DEPTH = 2
ACCOUNT_COUNT = 4
```

Nếu batch có ít giao dịch hơn `BATCH_SIZE`, có thể padding bằng giao dịch rỗng:

```text
from = 0
to = 0
amount = 0
```

Circuit cần xử lý giao dịch rỗng theo quy ước rõ ràng để không làm thay đổi state root.

---

### 7.7. Range constraint

Trong Circom, các phép tính nằm trong finite field, nên cần giới hạn miền giá trị để tránh kết quả không đúng theo số học thông thường.

Nên thêm constraint:

```text
0 <= amount < 2^32
0 <= balance < 2^32
fromAccountId < ACCOUNT_COUNT
toAccountId < ACCOUNT_COUNT
```

Có thể dùng `Num2Bits`, `LessThan`, `LessEqThan` hoặc các component tương ứng từ `circomlib`.

---

### 7.8. Giới hạn về chữ ký và nonce

Prototype ban đầu có thể chưa cần chữ ký giao dịch để giảm độ phức tạp, nhưng báo cáo nên ghi rõ giới hạn:

- Nếu không có signature, sequencer giả định là thành phần tin cậy trong demo.
- Nếu không có nonce, hệ thống chưa chống replay transaction đầy đủ.
- Hướng phát triển là thêm `signature` và `nonce` vào transaction, sau đó circuit kiểm tra chữ ký hoặc contract kiểm tra dữ liệu giao dịch tùy thiết kế.

---

### 7.9. Data availability trong prototype

zkRollup thực tế cần công bố đủ dữ liệu để người dùng có thể tái dựng state hoặc kiểm tra lịch sử cập nhật. Prototype này chỉ tập trung vào validity proof và cập nhật `stateRoot`.

Trong demo có thể mô phỏng data availability bằng cách:

- Lưu batch transaction trong file JSON.
- Emit `batchHash` trong event `BatchSubmitted`.
- Ghi rõ trong báo cáo rằng hệ thống chưa triển khai cơ chế data availability production-grade.

---

## 8. Các version triển khai

Khuyến nghị triển khai theo thứ tự để giảm rủi ro:

```text
MVP bắt buộc: Version 1 chạy hoàn chỉnh.
Mục tiêu chính: Version 2 nếu còn thời gian.
Phiên bản đẹp nhất cho báo cáo: Version 3.
```

Nếu thời gian giới hạn, không nên bắt đầu ngay từ Version 3. Nên hoàn thành Version 1 trước để chắc chắn có circuit, proof, verifier và contract chạy được end-to-end.

### Version 1: Chứng minh một giao dịch chuyển token

Độ khó: Dễ nhất.

Mục tiêu:

- Viết circuit kiểm tra một giao dịch.
- Generate proof.
- Verify proof bằng snarkjs.
- Sinh `Verifier.sol`.
- Verify proof trên smart contract.

Logic:

```text
A có 100 token
B có 50 token
A chuyển 10 token cho B

Circuit chứng minh:
100 >= 10
100 - 10 = 90
50 + 10 = 60
```

---

### Version 2: Batch transfer proof

Độ khó: Trung bình.

Mục tiêu:

- Xử lý nhiều transaction cùng lúc.
- Mô phỏng đúng tinh thần rollup hơn.
- Một proof chứng minh toàn bộ batch hợp lệ.

Ví dụ:

```text
Tx1: Account 0 -> Account 1: 10
Tx2: Account 1 -> Account 2: 5
Tx3: Account 2 -> Account 3: 3
```

---

### Version 3: Batch transfer + Merkle state root

Độ khó: Khó hơn nhưng đẹp nhất cho báo cáo.

Mục tiêu:

- Có Merkle tree.
- Có `oldStateRoot`.
- Có `newStateRoot`.
- Smart contract chỉ lưu root, không lưu toàn bộ balance.
- Nếu proof hợp lệ, contract cập nhật root mới.

Đây là version khuyến nghị nếu còn đủ thời gian.

---

## 9. Thiết kế smart contract

### 9.1. Verifier.sol

`Verifier.sol` được sinh tự động từ snarkjs:

```bash
snarkjs zkey export solidityverifier transfer_final.zkey contracts/Verifier.sol
```

Contract này có nhiệm vụ xác minh zk-proof.

Thông thường sẽ có hàm tương tự:

```solidity
function verifyProof(...) public view returns (bool);
```

---

### 9.2. MiniRollup.sol

Contract chính lưu `stateRoot`.

Pseudo-code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MiniRollup {
    uint256 public stateRoot;
    Verifier public verifier;

    event BatchSubmitted(uint256 oldRoot, uint256 newRoot, uint256 batchHash);

    constructor(uint256 _initialRoot, address _verifier) {
        stateRoot = _initialRoot;
        verifier = Verifier(_verifier);
    }

    function submitBatch(
        Proof calldata proof,
        uint256 oldRoot,
        uint256 newRoot,
        uint256 batchHash
    ) external {
        require(oldRoot == stateRoot, "Invalid old root");

        uint256[] memory publicSignals = new uint256[](3);
        publicSignals[0] = oldRoot;
        publicSignals[1] = newRoot;
        publicSignals[2] = batchHash;

        bool ok = verifier.verifyProof(..., publicSignals);
        require(ok, "Invalid proof");

        stateRoot = newRoot;

        emit BatchSubmitted(oldRoot, newRoot, batchHash);
    }
}
```

Ý nghĩa:

- `oldRoot` phải bằng `stateRoot` hiện tại.
- Proof phải hợp lệ.
- Nếu đúng, cập nhật `stateRoot = newRoot`.
- Nếu sai, transaction bị revert.
- Trong code thật, chữ ký hàm `verifyProof` phụ thuộc vào `Verifier.sol` do snarkjs sinh ra. Thường verifier nhận các phần của proof như `a`, `b`, `c` và mảng public signals, không chỉ nhận một biến `bytes proof`.

---

## 10. Thiết kế circuit

File đề xuất:

```text
circuits/transfer.circom
```

Circuit version đơn giản:

```text
Input:
- oldFromBalance
- oldToBalance
- amount
- newFromBalance
- newToBalance

Check:
- oldFromBalance >= amount
- oldFromBalance - amount = newFromBalance
- oldToBalance + amount = newToBalance
```

Pseudo-code:

```text
template Transfer() {
    signal input oldFromBalance;
    signal input oldToBalance;
    signal input amount;
    signal input newFromBalance;
    signal input newToBalance;

    // Check subtraction
    oldFromBalance - amount === newFromBalance;

    // Check addition
    oldToBalance + amount === newToBalance;

    // Check sufficient balance
    oldFromBalance >= amount;
}
```

Lưu ý: Circom không viết trực tiếp `>=` đơn giản như ngôn ngữ lập trình thường. Cần dùng comparator component, ví dụ `LessThan`, `GreaterEqThan` hoặc tự thiết kế bằng bit decomposition.

---

### 10.1. Circuit version có Merkle root

Nếu triển khai Version 3, circuit nên có cấu trúc gần như sau:

```text
Public input:
- oldStateRoot
- newStateRoot
- batchHash

Private input:
- transactions[BATCH_SIZE]
- oldBalances
- newBalances
- merklePaths
- merklePathIndices
```

Các constraint chính:

```text
1. Tính txHash cho từng transaction.
2. Tính batchHash từ danh sách txHash.
3. Kiểm tra account leaf nằm trong root hiện tại bằng Merkle path.
4. Kiểm tra fromBalance >= amount.
5. Kiểm tra balance sau giao dịch:
   newFromBalance = oldFromBalance - amount
   newToBalance = oldToBalance + amount
6. Tính root mới sau khi cập nhật leaf.
7. Root cuối cùng phải bằng public input newStateRoot.
```

Với batch nhiều giao dịch, root được cập nhật tuần tự:

```text
root0 = oldStateRoot
root1 = apply(tx1, root0)
root2 = apply(tx2, root1)
...
rootN = newStateRoot
```

---

### 10.2. Component Circom nên dùng

Các component nên dùng từ `circomlib`:

| Mục đích | Component gợi ý |
|---|---|
| Hash leaf/node | `Poseidon` |
| So sánh số dư | `LessThan`, `LessEqThan` |
| Giới hạn bit | `Num2Bits` |
| Chọn trái/phải trong Merkle path | `Mux1` hoặc constraint tự viết |

Ví dụ kiểm tra đủ số dư:

```text
isLess = LessThan(32)([oldFromBalance, amount])
isLess === 0
```

Ý nghĩa: `oldFromBalance < amount` phải sai, nên account đủ số dư.

---

### 10.3. Quy ước input cho circuit

Để dễ code và dễ demo, nên cố định các tham số:

```text
ACCOUNT_COUNT = 4
TREE_DEPTH = 2
BATCH_SIZE = 2
BALANCE_BITS = 32
```

Input JSON nên có dạng:

```json
{
  "oldStateRoot": "123",
  "newStateRoot": "456",
  "batchHash": "789",
  "transactions": [
    { "from": 0, "to": 1, "amount": 10 },
    { "from": 1, "to": 2, "amount": 5 }
  ],
  "oldBalances": ["100", "50", "20", "10"],
  "newBalances": ["90", "55", "25", "10"],
  "merklePaths": [],
  "merklePathIndices": []
}
```

Trong lúc code thật, `merklePaths` và `merklePathIndices` nên được generate tự động bằng script thay vì nhập tay.

---

## 11. Script cần viết

### 11.1. compile-circuit.sh

Nhiệm vụ:

- Compile circuit.
- Generate witness.
- Setup proving key.
- Export verification key.
- Export Solidity verifier.

Pseudo-command:

```bash
circom circuits/transfer.circom --r1cs --wasm --sym -o build

snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

snarkjs groth16 setup build/transfer.r1cs pot12_final.ptau transfer_0000.zkey
snarkjs zkey contribute transfer_0000.zkey transfer_final.zkey --name="Second contribution" -v

snarkjs zkey export verificationkey transfer_final.zkey verification_key.json
snarkjs zkey export solidityverifier transfer_final.zkey contracts/Verifier.sol
```

---

### 11.2. generate-proof.js

Nhiệm vụ:

- Đọc input.
- Generate witness.
- Generate proof.
- Xuất `proof.json` và `public.json`.

Pseudo-flow:

```text
1. Read input/input.json
2. Generate witness
3. Generate proof
4. Save proof.json
5. Save public.json
```

---

### 11.3. deploy.js

Nhiệm vụ:

- Deploy `Verifier.sol`.
- Deploy `MiniRollup.sol`.
- Truyền `initialStateRoot`.
- Lưu contract address.

---

### 11.4. submit-batch.js

Nhiệm vụ:

- Đọc `proof.json`.
- Đọc `public.json`.
- Gọi `submitBatch`.
- Kiểm tra `stateRoot` sau khi submit.

Expected output:

```text
Old state root: 0xabc...
New state root: 0xdef...
Proof verified successfully.
State root updated.
```

---

## 12. Test case cần có

### Test case 1: Giao dịch hợp lệ

Input:

```text
oldFromBalance = 100
oldToBalance = 50
amount = 10
newFromBalance = 90
newToBalance = 60
```

Expected:

```text
Proof valid.
Contract accepts batch.
stateRoot updated.
```

---

### Test case 2: Giao dịch sai số dư

Input:

```text
oldFromBalance = 5
oldToBalance = 50
amount = 10
newFromBalance = -5
newToBalance = 60
```

Expected:

```text
Proof generation fails hoặc proof invalid.
Contract rejects batch.
```

---

### Test case 3: New balance bị sửa sai

Input:

```text
oldFromBalance = 100
oldToBalance = 50
amount = 10
newFromBalance = 95
newToBalance = 60
```

Expected:

```text
Circuit rejects because 100 - 10 != 95.
```

---

### Test case 4: oldRoot không khớp stateRoot hiện tại

Input:

```text
contract stateRoot = 0xabc
submit oldRoot = 0x999
```

Expected:

```text
Contract revert: Invalid old root.
```

---

### Test case 5: Proof đúng nhưng public input bị sửa

Input:

```text
Proof được tạo cho newRoot A
Nhưng khi submit lại truyền newRoot B
```

Expected:

```text
Contract rejects proof.
```

---

### Test case 6: Merkle proof sai

Input:

```text
Balance đúng nhưng merklePath của account bị sửa.
```

Expected:

```text
Circuit rejects hoặc proof generation fails.
```

---

### Test case 7: Replay batch cũ

Input:

```text
Submit batch hợp lệ lần 1 thành công.
Submit lại cùng proof và cùng oldRoot lần 2.
```

Expected:

```text
Lần 2 contract revert: Invalid old root.
```

---

### Test case 8: Thứ tự transaction bị thay đổi

Input:

```text
Proof được tạo cho batch [Tx1, Tx2]
Nhưng batchHash khi submit đại diện cho [Tx2, Tx1]
```

Expected:

```text
Contract rejects proof.
```

---

### Test case 9: AccountId ngoài phạm vi Merkle tree

Input:

```text
ACCOUNT_COUNT = 4
from = 5
```

Expected:

```text
Circuit rejects vì accountId không hợp lệ.
```

---

## 13. Kịch bản demo thuyết trình

### Demo 1: Show trạng thái ban đầu

```text
Account 0: 100
Account 1: 50
Account 2: 20
Account 3: 10

Initial state root:
0xabc...
```

### Demo 2: Tạo batch giao dịch

```text
Tx1: 0 -> 1: 10
Tx2: 1 -> 2: 5
```

### Demo 3: Xử lý off-chain

```text
Account 0: 90
Account 1: 55
Account 2: 25
Account 3: 10

New state root:
0xdef...
```

### Demo 4: Generate proof

Command:

```bash
node scripts/generate-proof.js
```

Output:

```text
Proof generated successfully.
```

### Demo 5: Submit proof lên smart contract

Command:

```bash
node scripts/submit-batch.js
```

Output:

```text
Proof verified.
State root updated.
```

### Demo 6: Thử submit dữ liệu sai

Sửa `amount`, `newRoot` hoặc `oldRoot`.

Expected:

```text
Invalid proof
```

hoặc:

```text
Invalid old root
```

---

## 14. Nội dung báo cáo

### Chương 1: Giới thiệu

Nội dung cần viết:

- Blockchain Layer 1 có hạn chế về tốc độ và phí giao dịch.
- Rollup là giải pháp Layer 2 giúp mở rộng khả năng xử lý.
- zkRollup sử dụng zero-knowledge proof để chứng minh tính hợp lệ của nhiều giao dịch.
- Đồ án xây dựng mô hình Mini zkRollup để mô phỏng cơ chế này.

---

### Chương 2: Cơ sở lý thuyết

Các mục cần có:

```text
2.1. Blockchain Layer 1
2.2. Layer 2 Scaling
2.3. Rollup
2.4. Optimistic Rollup
2.5. zkRollup
2.6. Zero-Knowledge Proof
2.7. Merkle Tree
2.8. State Root
2.9. Sequencer
2.10. Prover và Verifier
```

---

### Chương 3: Phân tích yêu cầu

Yêu cầu chức năng:

- Tạo account mẫu.
- Tạo transaction chuyển token.
- Gom transaction thành batch.
- Xử lý batch off-chain.
- Tạo zk-proof.
- Verify proof on-chain.
- Cập nhật state root.

Yêu cầu phi chức năng:

- Prototype chạy được local.
- Có test case đúng/sai.
- Có log kết quả rõ ràng.
- Code có thể demo trong buổi báo cáo.

---

### Chương 4: Thiết kế hệ thống

Nội dung cần trình bày:

- Sơ đồ kiến trúc.
- Thiết kế account.
- Thiết kế transaction.
- Thiết kế batch.
- Thiết kế Merkle tree.
- Thiết kế circuit.
- Thiết kế smart contract.
- Thiết kế script generate proof.

---

### Chương 5: Cài đặt và thực nghiệm

Nội dung cần có:

- Môi trường cài đặt.
- Các bước chạy project.
- Kết quả generate proof.
- Kết quả verify proof.
- Kết quả submit batch.
- Kết quả test sai proof.

---

### Chương 6: Đánh giá

Ưu điểm:

- Mô phỏng được cơ chế cốt lõi của zkRollup.
- Giảm dữ liệu xử lý on-chain.
- Smart contract không cần xử lý từng giao dịch.
- Có bằng chứng mật mã để xác minh batch.

Hạn chế:

- Chưa hỗ trợ smart contract trên Layer 2.
- Chưa có bridge tài sản thật.
- Chưa có decentralized sequencer.
- Chưa tối ưu prover.
- Merkle tree và data availability mới ở mức demo.
- Nếu chưa triển khai signature, hệ thống giả định sequencer trung thực trong demo.
- Nếu chưa triển khai nonce, hệ thống chưa chống replay transaction ở mức giao dịch riêng lẻ.
- Data availability chưa production-grade, batch chỉ được lưu/log để phục vụ demo.

---

### Chương 7: Kết luận và hướng phát triển

Kết luận:

- Đồ án đã xây dựng được prototype mô phỏng zkRollup.
- Hệ thống có thể xử lý giao dịch off-chain.
- Có thể tạo zk-proof.
- Smart contract có thể xác minh proof và cập nhật state root.

Hướng phát triển:

- Hỗ trợ nhiều account hơn.
- Hỗ trợ nhiều loại giao dịch hơn.
- Thêm giao diện frontend.
- Thêm bridge nạp/rút token.
- Tối ưu circuit.
- Triển khai lên testnet.

---

## 15. Slide thuyết trình đề xuất

### Slide 1: Tiêu đề

**Mini zkRollup cho giao dịch token đơn giản**

Thông tin:

- Tên sinh viên
- Môn học
- Giảng viên
- Ngày báo cáo

---

### Slide 2: Vấn đề

- Blockchain Layer 1 xử lý giao dịch chậm.
- Phí giao dịch cao khi mạng đông.
- Cần giải pháp mở rộng nhưng vẫn giữ bảo mật.

---

### Slide 3: Rollup là gì?

- Rollup xử lý giao dịch ngoài Layer 1.
- Gom nhiều giao dịch thành batch.
- Gửi kết quả cuối cùng lên Layer 1.

---

### Slide 4: zkRollup là gì?

- zkRollup dùng zero-knowledge proof.
- Proof chứng minh batch hợp lệ.
- Blockchain chỉ cần verify proof.

---

### Slide 5: Kiến trúc hệ thống

Hiển thị sơ đồ:

```text
User -> Sequencer -> State Engine -> Prover -> Smart Contract
```

---

### Slide 6: Thiết kế dữ liệu

- Account
- Balance
- Transaction
- Batch
- State root

---

### Slide 7: ZK Circuit

Circuit kiểm tra:

```text
fromBalance >= amount
newFromBalance = oldFromBalance - amount
newToBalance = oldToBalance + amount
```

---

### Slide 8: Smart Contract

- `Verifier.sol`: xác minh proof.
- `MiniRollup.sol`: lưu và cập nhật state root.

---

### Slide 9: Demo flow

```text
1. Tạo account
2. Tạo batch giao dịch
3. Generate proof
4. Submit proof
5. Contract verify
6. Update state root
```

---

### Slide 10: Kết quả

- Proof hợp lệ được accept.
- Proof sai bị reject.
- `stateRoot` được cập nhật khi proof đúng.

---

### Slide 11: Đánh giá

Ưu điểm:

- Mô phỏng đúng ý tưởng zkRollup.
- Có kiểm chứng bằng smart contract.
- Có test proof đúng/sai.

Hạn chế:

- Chưa phải production rollup.
- Chưa có bridge thật.
- Chưa hỗ trợ smart contract Layer 2.

---

### Slide 12: Kết luận

- zkRollup giúp mở rộng blockchain.
- Mini prototype chứng minh được cơ chế cốt lõi.
- Có thể phát triển tiếp thành hệ thống hoàn chỉnh hơn.

---

## 16. Checklist thực hiện

### Giai đoạn 1: Chuẩn bị

- [ ] Cài Node.js
- [ ] Cài Hardhat
- [ ] Cài Circom
- [ ] Cài snarkjs
- [ ] Tạo project `mini-zkrollup`
- [ ] Tạo cấu trúc thư mục

---

### Giai đoạn 2: Circuit

- [ ] Viết `transfer.circom`
- [ ] Compile circuit
- [ ] Tạo input mẫu
- [ ] Generate witness
- [ ] Generate proof
- [ ] Verify proof bằng snarkjs

---

### Giai đoạn 3: Smart contract

- [ ] Sinh `Verifier.sol`
- [ ] Viết `MiniRollup.sol`
- [ ] Deploy contract
- [ ] Kiểm tra `stateRoot` ban đầu

---

### Giai đoạn 4: Script

- [ ] Viết `generate-proof.js`
- [ ] Viết `submit-batch.js`
- [ ] Viết `deploy.js`
- [ ] Log kết quả rõ ràng

---

### Giai đoạn 5: Test

- [ ] Test giao dịch hợp lệ
- [ ] Test giao dịch thiếu số dư
- [ ] Test sửa sai balance
- [ ] Test oldRoot sai
- [ ] Test public input bị sửa

---

### Giai đoạn 6: Báo cáo

- [ ] Viết phần giới thiệu
- [ ] Viết cơ sở lý thuyết
- [ ] Viết thiết kế hệ thống
- [ ] Chèn sơ đồ kiến trúc
- [ ] Chèn hình/chụp kết quả demo
- [ ] Viết đánh giá
- [ ] Viết kết luận

---

### Giai đoạn 7: Slide

- [ ] Tạo slide theo 12 slide đề xuất
- [ ] Chèn flow demo
- [ ] Chèn kết quả chạy code
- [ ] Chuẩn bị lời thuyết trình
- [ ] Chuẩn bị câu hỏi phản biện

---

## 17. Lệnh chạy dự kiến

### Cài project

```bash
mkdir mini-zkrollup
cd mini-zkrollup
npm init -y
npm install --save-dev hardhat
npm install snarkjs circomlib ethers
npx hardhat init
```

### Compile circuit

```bash
bash scripts/compile-circuit.sh
```

Nếu dùng Windows, có thể chạy bằng Git Bash/WSL. Một lựa chọn khác là đổi script compile sang Node.js để tránh phụ thuộc Bash.

### Generate proof

```bash
node scripts/generate-proof.js
```

### Deploy contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Submit batch

```bash
node scripts/submit-batch.js
```

### Chạy test

```bash
npx hardhat test
```

---

## 18. Tiêu chí hoàn thành đồ án

Đồ án được xem là hoàn thành nếu có đủ các phần sau:

- [ ] Giải thích được zkRollup là gì.
- [ ] Có kiến trúc hệ thống rõ ràng.
- [ ] Có circuit kiểm tra giao dịch.
- [ ] Circuit có range constraint cho `amount`, `balance`, `accountId`.
- [ ] Nếu làm Version 3, circuit kiểm tra Merkle path và liên kết `oldStateRoot` với `newStateRoot`.
- [ ] Có proof được generate thành công.
- [ ] Có smart contract verify proof.
- [ ] Có stateRoot được cập nhật.
- [ ] Có test case đúng và sai.
- [ ] Có test public input sai, Merkle proof sai và replay batch cũ.
- [ ] Có giải thích rõ giới hạn về signature, nonce và data availability.
- [ ] Có báo cáo.
- [ ] Có slide.
- [ ] Có demo chạy được.

---

## 19. Gợi ý phân công nếu làm nhóm

| Thành viên | Nhiệm vụ |
|---|---|
| Người 1 | Tìm hiểu lý thuyết zkRollup, viết báo cáo |
| Người 2 | Viết circuit và generate proof |
| Người 3 | Viết smart contract và test |
| Người 4 | Viết script, frontend/demo, làm slide |

---

## 20. Kết luận định hướng

Đối với đồ án môn học, mục tiêu không phải là tạo ra một zkRollup hoàn chỉnh như các dự án lớn.

Mục tiêu đúng là:

```text
Xây dựng một prototype đủ nhỏ để hiểu và chứng minh cơ chế:
off-chain execution + batch transaction + zk-proof + on-chain verification + state root update.
```

Nếu làm được các phần này, đồ án đã thể hiện đúng bản chất kỹ thuật của zkRollup.
