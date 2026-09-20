/* Pure ABI helpers for the RELL RightsRegistry. Kept dependency free so the
   production app and the build checks exercise exactly the same decoder. */
export const MAX_PROFILE_BYTES = 2 * 1024 * 1024;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(String(value || "").trim());
}

export function normalizeAddress(value) {
  const address = String(value || "").trim();
  return isAddress(address) ? address.toLowerCase() : "";
}

export function decodeRightsRecord(result) {
  const data = String(result || "").replace(/^0x/, "");
  if (data.length < 384) throw new Error("The registry returned an invalid record");
  const word = index => data.slice(index * 64, (index + 1) * 64);

  // A struct containing a string is returned as one dynamic tuple. The first
  // word points to that tuple; the string offset is then relative to its base.
  const tupleOffset = Number(BigInt("0x" + word(0)));
  if (!Number.isSafeInteger(tupleOffset) || tupleOffset % 32 !== 0) {
    throw new Error("The registry returned an invalid tuple offset");
  }
  const base = tupleOffset / 32;
  const asset = "0x" + word(base).slice(24);
  if (asset.toLowerCase() === ZERO_ADDRESS) return null;

  const status = Number(BigInt("0x" + word(base + 1)));
  const lastUpdated = Number(BigInt("0x" + word(base + 2)));
  const profileHash = "0x" + word(base + 3);
  const stringOffset = Number(BigInt("0x" + word(base + 4)));
  const lengthStart = tupleOffset * 2 + stringOffset * 2;
  if (!Number.isSafeInteger(stringOffset) || lengthStart + 64 > data.length) {
    throw new Error("The registry returned an invalid profile pointer");
  }
  const stringLength = Number(BigInt("0x" + data.slice(lengthStart, lengthStart + 64)));
  if (!Number.isSafeInteger(stringLength) || stringLength > MAX_PROFILE_BYTES) {
    throw new Error("The profile pointer is too large to read safely");
  }
  const valueStart = lengthStart + 64;
  const valueHex = data.slice(valueStart, valueStart + stringLength * 2);
  if (valueHex.length !== stringLength * 2) throw new Error("The registry returned a truncated profile pointer");
  const pairs = valueHex.match(/.{1,2}/g) || [];
  const bytes = new Uint8Array(pairs.map(byte => parseInt(byte, 16)));
  const profileURI = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return { asset, status, lastUpdated, profileHash, profileURI };
}
