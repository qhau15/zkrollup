import { buildPoseidon } from "circomlibjs";

let poseidonInstance;

export async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }

  return poseidonInstance;
}

export async function poseidonHash(values) {
  const poseidon = await getPoseidon();
  const fieldValue = poseidon(values.map((value) => BigInt(value)));
  return BigInt(poseidon.F.toString(fieldValue));
}

export function toDecimalString(value) {
  return BigInt(value).toString(10);
}
