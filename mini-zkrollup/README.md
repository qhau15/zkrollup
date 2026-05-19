# Mini zkRollup

Prototype zkRollup nhỏ cho giao dịch token đơn giản.

## Trạng thái hiện tại

- Hardhat project.
- `MiniRollup.sol` lưu và cập nhật `stateRoot`.
- `MockVerifier.sol` giúp test flow on-chain trước khi gắn verifier thật từ snarkjs.
- Script tạo batch demo bằng Poseidon/Merkle tree.
- Circuit MVP `transfer.circom` kiểm tra một giao dịch.
- Circuit Version 3 `batch_with_roots.circom` đang là skeleton cho batch + Merkle root.

## Chạy nhanh

```bash
npm install
npm run generate:batch
npm test
npm run demo
```

Compile contract:

```bash
npm run compile
```

Compile circuit nếu đã cài Circom 2:

```bash
npm run compile:circuit
```

## Ghi chú

MVP hiện dùng `MockVerifier` để kiểm tra logic contract và demo cập nhật root. `npm run demo` deploy và submit trong cùng một phiên Hardhat network. Nếu muốn dùng `npm run deploy` rồi `npm run submit:batch`, hãy chạy trên node local riêng bằng `npx hardhat node` và thêm `--network localhost`.
