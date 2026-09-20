/* Live RELL registry reader. No wallet is required: all reads use public RPC. */
import { MAX_PROFILE_BYTES, decodeRightsRecord, isAddress, normalizeAddress } from "./registry.mjs";

const GET_RECORD_SELECTOR = "617fba04";
const STATUS = ["Active", "Paused", "Restricted", "Corporate action"];
const HASH_MODULE = "https://cdn.jsdelivr.net/npm/@noble/hashes@1.7.1/sha3.js/+esm";

const RELL = window.RELL = window.RELL || {};
const form = document.querySelector("[data-lookup-form]");
const input = document.getElementById("asset-address");
const errorNode = document.querySelector("[data-lookup-error]");
const submitLabel = document.querySelector("[data-submit-label]");
const resultState = document.querySelector("[data-result-state]");
const recordNode = document.querySelector("[data-record]");
const profileNode = document.querySelector("[data-profile]");
const profileMessage = document.querySelector("[data-profile-message]");
const trackedList = document.querySelector("[data-tracked-list]");
const networkState = document.querySelector("[data-network-state]");
const networkLabel = document.querySelector("[data-network-label]");
const networkDetail = document.querySelector("[data-network-detail]");
let config;
let busy = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch (error) {
    return "";
  }
}

function resolveProfileUrl(uri) {
  const value = String(uri || "").trim();
  if (value.startsWith("ipfs://")) {
    const gateway = String(config.profile.ipfsGateway || "https://ipfs.io/ipfs/").replace(/\/+$/, "") + "/";
    return gateway + value.slice(7).replace(/^ipfs\//, "");
  }
  if (value.startsWith("ar://")) return "https://arweave.net/" + value.slice(5);
  return safeHttpUrl(value);
}

function explorerAddress(address) {
  return String(config.network.explorerUrl || "").replace(/\/+$/, "") + "/address/" + address;
}

function setNetwork(state, label, detail) {
  networkState.dataset.networkState = state;
  networkLabel.textContent = label;
  if (detail) networkDetail.textContent = detail;
}

function setResultState(state, title, message) {
  resultState.dataset.state = state;
  resultState.textContent = "";
  const mark = element("div", "result-state__mark", state === "loading" ? "…" : state === "error" ? "!" : state === "empty" ? "—" : "01");
  mark.setAttribute("aria-hidden", "true");
  const copy = element("div");
  copy.appendChild(element("h3", "", title));
  copy.appendChild(element("p", "", message));
  resultState.append(mark, copy);
  resultState.hidden = false;
  recordNode.hidden = true;
}

function setBusy(value) {
  busy = value;
  form.setAttribute("aria-busy", value ? "true" : "false");
  form.querySelector("button").disabled = value;
  submitLabel.textContent = value ? "Reading" : "Read rights";
}

async function rpc(method, params) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(config.network.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) throw new Error("RPC returned HTTP " + response.status);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.message || "RPC request failed");
    return payload.result;
  } finally {
    window.clearTimeout(timeout);
  }
}

function encodeAddress(address) {
  return address.slice(2).toLowerCase().padStart(64, "0");
}

async function getRecord(address) {
  const data = "0x" + GET_RECORD_SELECTOR + encodeAddress(address);
  const result = await rpc("eth_call", [{ to: config.contracts.rightsRegistry, data }, "latest"]);
  return decodeRightsRecord(result);
}

function verificationKey(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("onchain") || text.includes("on-chain")) return "onchain";
  if (text.includes("issuer") || text.includes("legal")) return "issuer";
  return "reported";
}

function verificationBadge(value) {
  const key = verificationKey(value);
  const label = key === "onchain" ? "Onchain" : key === "issuer" ? "Issuer" : "Reported";
  const badge = element("span", "state state--" + key);
  const dot = element("span", "state__dot");
  dot.setAttribute("aria-hidden", "true");
  badge.append(dot, document.createTextNode(label));
  return badge;
}

function displayValue(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "Not stated";
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") {
    return value.value || value.answer || value.status || value.description || JSON.stringify(value);
  }
  return String(value);
}

function claimFrom(value, fallbackName) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      name: value.name || value.title || value.claim || value.label || fallbackName,
      value: displayValue(value.value ?? value.answer ?? value.status ?? value.description ?? value.summary),
      verification: value.verification || value.verificationStatus || value.sourceType || value.source || "reported"
    };
  }
  return { name: fallbackName, value: displayValue(value), verification: "reported" };
}

function normalizeClaims(category) {
  const raw = category && typeof category === "object" && !Array.isArray(category)
    ? category.claims || category.items || category.rights || category
    : category;
  if (Array.isArray(raw)) return raw.map((item, index) => claimFrom(item, "Claim " + (index + 1)));
  if (!raw || typeof raw !== "object") return [claimFrom(raw, "Finding")];
  const ignored = new Set(["name", "title", "summary", "description", "verification", "status"]);
  return Object.keys(raw).filter(key => !ignored.has(key)).map(key => claimFrom(raw[key], humanize(key)));
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, char => char.toUpperCase());
}

function normalizeCategories(profile) {
  const raw = profile.rights || profile.categories || profile.claims || [];
  if (Array.isArray(raw)) {
    return raw.map((category, index) => ({
      title: category.title || category.name || category.category || "Category " + (index + 1),
      summary: category.summary || category.description || "",
      claims: normalizeClaims(category)
    }));
  }
  if (raw && typeof raw === "object") {
    return Object.keys(raw).map(key => ({
      title: humanize(key),
      summary: raw[key] && (raw[key].summary || raw[key].description) || "",
      claims: normalizeClaims(raw[key])
    }));
  }
  return [];
}

function renderSources(profile) {
  const host = document.querySelector("[data-source-list]");
  const section = document.querySelector("[data-profile-sources]");
  host.textContent = "";
  let raw = profile.sources || [];
  if (!Array.isArray(raw) && raw && typeof raw === "object") {
    raw = Object.keys(raw).map(key => {
      const value = raw[key];
      return typeof value === "string" ? { title: humanize(key), url: value } : { title: humanize(key), ...value };
    });
  }
  if (!Array.isArray(raw) || !raw.length) {
    section.hidden = true;
    return;
  }
  raw.forEach((source, index) => {
    const row = element("div", "profile-source");
    const title = typeof source === "string" ? "Source " + (index + 1) : source.title || source.name || source.type || "Source " + (index + 1);
    const rawUrl = typeof source === "string" ? source : source.url || source.uri || source.href;
    row.appendChild(element("span", "", title));
    const url = rawUrl && (rawUrl.startsWith("ipfs://") ? resolveProfileUrl(rawUrl) : safeHttpUrl(rawUrl));
    if (url) {
      const link = element("a", "", "Open source");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      row.appendChild(link);
    } else if (rawUrl) {
      row.appendChild(element("span", "mono", rawUrl));
    }
    host.appendChild(row);
  });
  section.hidden = false;
}

function renderProfile(profile) {
  const identity = profile.identity || {};
  const title = identity.name || profile.name || profile.title || "Token rights profile";
  const symbol = identity.symbol || profile.symbol;
  document.querySelector("[data-profile-title]").textContent = symbol ? title + " · " + symbol : title;

  const summaryHost = document.querySelector("[data-profile-summary]");
  summaryHost.textContent = "";
  summaryHost.appendChild(element("h3", "", profile.headline || profile.summaryTitle || "What this token gives you"));
  const summary = profile.summary || profile.description || identity.underlyingAsset || "The profile below is published by a RELL verifier and anchored to the registry.";
  summaryHost.appendChild(element("p", "", displayValue(summary)));

  const categoryHost = document.querySelector("[data-profile-categories]");
  categoryHost.textContent = "";
  const categories = normalizeCategories(profile);
  categories.forEach((category, index) => {
    const card = element("section", "profile-category");
    const head = element("div", "profile-category__head");
    head.appendChild(element("h3", "", (index + 1).toString().padStart(2, "0") + " · " + category.title));
    if (category.summary) head.appendChild(element("span", "label", category.summary));
    card.appendChild(head);
    const claims = element("div", "profile-category__claims");
    category.claims.forEach(claim => {
      const row = element("div", "profile-claim");
      row.appendChild(element("span", "profile-claim__name", claim.name));
      row.appendChild(element("span", "profile-claim__value", claim.value));
      row.appendChild(verificationBadge(claim.verification));
      claims.appendChild(row);
    });
    card.appendChild(claims);
    categoryHost.appendChild(card);
  });

  if (!categories.length) {
    const empty = element("div", "profile-message", "This document is valid JSON, but it does not contain a recognized rights or claims collection.");
    categoryHost.appendChild(empty);
  }
  renderSources(profile);
  profileNode.hidden = false;
}

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyHash(bytes, expected) {
  try {
    const { keccak_256 } = await import(HASH_MODULE);
    return "0x" + bytesToHex(keccak_256(bytes)) === expected.toLowerCase();
  } catch (error) {
    return null;
  }
}

async function loadProfile(record) {
  const integrity = document.querySelector("[data-integrity-state]");
  integrity.style.color = "";
  profileNode.hidden = true;
  profileMessage.hidden = true;
  const url = resolveProfileUrl(record.profileURI);
  if (!url) {
    integrity.textContent = "Hash anchored onchain";
    profileMessage.textContent = "The profile uses a URI this browser cannot fetch. The onchain record is still shown above.";
    profileMessage.hidden = false;
    return;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("Profile source returned HTTP " + response.status);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PROFILE_BYTES) throw new Error("Profile document is larger than 2 MB");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_PROFILE_BYTES) throw new Error("Profile document is larger than 2 MB");
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
    const matches = await verifyHash(bytes, record.profileHash);
    integrity.textContent = matches === true ? "Verified against chain" : matches === false ? "Hash mismatch" : "Hash anchored onchain";
    integrity.style.color = matches === false ? "#b42318" : matches === true ? "var(--onchain)" : "";
    renderProfile(JSON.parse(text));
  } catch (error) {
    integrity.textContent = "Hash anchored onchain";
    profileMessage.textContent = "The record is live, but its profile document could not be loaded: " + (error.name === "AbortError" ? "request timed out." : error.message + ".");
    profileMessage.hidden = false;
  } finally {
    window.clearTimeout(timeout);
  }
}

function renderRecord(record) {
  const statusLabel = STATUS[record.status] || "Unknown";
  const statusNode = document.querySelector("[data-record-status]");
  statusNode.textContent = statusLabel;
  statusNode.dataset.status = statusLabel.toLowerCase().replace(/\s+/g, "-");
  document.querySelector("[data-profile-title]").textContent = "Token rights profile";
  document.querySelector("[data-record-address]").textContent = record.asset;
  document.querySelector("[data-record-updated]").textContent = record.lastUpdated
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(record.lastUpdated * 1000)) + " UTC"
    : "Unknown";
  document.querySelector("[data-record-hash]").textContent = record.profileHash;
  const uri = document.querySelector("[data-record-uri]");
  uri.textContent = record.profileURI;
  uri.href = resolveProfileUrl(record.profileURI) || explorerAddress(config.contracts.rightsRegistry);
  const assetExplorer = document.querySelector("[data-asset-explorer]");
  assetExplorer.href = explorerAddress(record.asset);
  const integrity = document.querySelector("[data-integrity-state]");
  integrity.textContent = "Checking document";
  integrity.style.color = "";
  resultState.hidden = true;
  recordNode.hidden = false;
}

async function lookup(value, updateUrl = true) {
  const address = normalizeAddress(value);
  errorNode.textContent = "";
  if (!address) {
    errorNode.textContent = "Enter a complete 0x address with 40 hexadecimal characters.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  if (busy) return;
  input.removeAttribute("aria-invalid");
  input.value = address;
  setBusy(true);
  setResultState("loading", "Reading Robinhood Chain", "Checking this address against the deployed RELL rights registry.");
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("asset", address);
    window.history.pushState({ asset: address }, "", url);
  }
  try {
    const record = await getRecord(address);
    if (!record) {
      setResultState("empty", "No RELL profile yet", "This address is not registered. It may be a valid token, but no verifier has published a RELL rights profile for it.");
      return;
    }
    renderRecord(record);
    await loadProfile(record);
  } catch (error) {
    setResultState("error", "Could not read the registry", error.name === "AbortError" ? "The network request timed out. Please try again." : error.message + ".");
  } finally {
    setBusy(false);
  }
}

async function discoverAssets() {
  try {
    const fromBlock = "0x" + Number(config.contracts.rightsRegistryDeploymentBlock || 0).toString(16);
    const logs = await rpc("eth_getLogs", [{ address: config.contracts.rightsRegistry, fromBlock, toBlock: "latest" }]);
    const addresses = Array.from(new Set(logs
      .filter(log => Array.isArray(log.topics) && log.topics.length > 1)
      .map(log => "0x" + log.topics[1].slice(-40).toLowerCase())
      .filter(isAddress)));
    trackedList.textContent = "";
    if (!addresses.length) {
      trackedList.appendChild(element("p", "tracked__empty", "No assets have been registered yet. You can still paste any address above to check it."));
      return;
    }
    addresses.forEach(address => {
      const button = element("button", "tracked-asset");
      button.type = "button";
      button.appendChild(element("span", "tracked-asset__address", address));
      const action = element("span", "link-arrow", "Read rights");
      button.appendChild(action);
      button.addEventListener("click", () => {
        input.value = address;
        lookup(address);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      trackedList.appendChild(button);
    });
  } catch (error) {
    trackedList.textContent = "";
    trackedList.appendChild(element("p", "tracked__empty", "The asset index is temporarily unavailable. Direct address lookup still works."));
  }
}

function initToast() {
  let timer;
  RELL.toast = message => {
    const region = document.querySelector("[data-toast-region]");
    if (!region) return;
    region.textContent = "";
    const toast = element("div", "toast", message);
    region.appendChild(toast);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => toast.remove(), 2600);
  };
}

async function init() {
  initToast();
  RELL.initHeader();
  document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
  config = await RELL.loadConfig();
  const registryExplorer = document.querySelector("[data-registry-explorer]");
  registryExplorer.href = explorerAddress(config.contracts.rightsRegistry);

  form.addEventListener("submit", event => {
    event.preventDefault();
    lookup(input.value);
  });
  window.addEventListener("popstate", () => {
    const address = new URLSearchParams(window.location.search).get("asset") || "";
    input.value = address;
    if (address) lookup(address, false);
    else setResultState("idle", "Start with a token contract", "The app checks the immutable registry. It then loads the profile document anchored by that record.");
  });

  try {
    const blockHex = await rpc("eth_blockNumber", []);
    const block = Number(BigInt(blockHex));
    setNetwork("online", config.network.name + " online", "Chain ID " + config.network.chainId + " · Block " + block.toLocaleString());
  } catch (error) {
    setNetwork("offline", "Network unavailable", "Direct lookup may fail");
  }

  discoverAssets();
  const initial = new URLSearchParams(window.location.search).get("asset");
  if (initial) {
    input.value = initial;
    lookup(initial, false);
  }
}

init().catch(error => {
  setNetwork("offline", "App configuration unavailable", "Please try again later");
  setResultState("error", "RELL app could not start", error.message + ".");
});
