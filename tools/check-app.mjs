import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { decodeRightsRecord, normalizeAddress } from "../js/registry.mjs";

const root = new URL("../", import.meta.url);
const word = value => BigInt(value).toString(16).padStart(64, "0");

function encodedRecord({ asset, status, updated, hash, uri }) {
  const uriHex = Buffer.from(uri, "utf8").toString("hex");
  const paddedUri = uriHex.padEnd(Math.ceil(uriHex.length / 64) * 64, "0");
  return "0x" + [
    word(32),
    asset.slice(2).padStart(64, "0"),
    word(status),
    word(updated),
    hash.slice(2).padStart(64, "0"),
    word(160),
    word(uriHex.length / 2),
    paddedUri
  ].join("");
}

const fixture = {
  asset: "0x1234567890abcdef1234567890abcdef12345678",
  status: 2,
  updated: 1789813027,
  hash: "0x" + "ab".repeat(32),
  uri: "ipfs://bafy-rell/profile.json"
};
assert.deepEqual(decodeRightsRecord(encodedRecord(fixture)), {
  asset: fixture.asset,
  status: fixture.status,
  lastUpdated: fixture.updated,
  profileHash: fixture.hash,
  profileURI: fixture.uri
});

const empty = encodedRecord({
  asset: "0x" + "00".repeat(20),
  status: 0,
  updated: 0,
  hash: "0x" + "00".repeat(32),
  uri: ""
});
assert.equal(decodeRightsRecord(empty), null);
assert.equal(normalizeAddress("  0x1234567890ABCDEF1234567890ABCDEF12345678  "), fixture.asset);
assert.equal(normalizeAddress("0x1234"), "");
assert.throws(() => decodeRightsRecord("0x20"), /invalid record/);

const config = JSON.parse(await readFile(new URL("config/contracts.json", root), "utf8"));
assert.equal(config.network.chainId, "4663");
assert.match(config.network.rpcUrl, /^https:\/\//);
assert.match(config.contracts.rightsRegistry, /^0x[0-9a-fA-F]{40}$/);
assert.ok(config.contracts.rightsRegistryDeploymentBlock > 0);

const index = await readFile(new URL("index.html", root), "utf8");
const app = await readFile(new URL("app.html", root), "utf8");
assert.match(index, /href="app\.html"[^>]*>Open app/i);
assert.match(app, /data-lookup-form/);
assert.match(app, /js\/app\.js/);

console.log("RELL app checks pass: ABI decoder, config and entry points.");
