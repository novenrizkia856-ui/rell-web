// Mirrors config/contracts.json into config/contracts.js.
// The JSON file is the source of truth. The JS mirror only exists so the page
// can read the config when index.html is opened straight from disk (file://),
// where browsers block fetch(). Run after editing the JSON:
//   node tools/sync-config.mjs          write the mirror
//   node tools/sync-config.mjs --check  exit 1 if the mirror is stale
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "config", "contracts.json");
const jsPath = join(root, "config", "contracts.js");

const config = JSON.parse(readFileSync(jsonPath, "utf8"));
const output =
  "// GENERATED from config/contracts.json by tools/sync-config.mjs. Do not edit by hand.\n" +
  "window.RELL_CONFIG = " + JSON.stringify(config, null, 2) + ";\n";

if (process.argv.includes("--check")) {
  // Ignore line ending differences introduced by git autocrlf on Windows.
  const current = existsSync(jsPath) ? readFileSync(jsPath, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== output) {
    console.error("config/contracts.js is stale. Run: node tools/sync-config.mjs");
    process.exit(1);
  }
  console.log("config/contracts.js matches config/contracts.json");
} else {
  writeFileSync(jsPath, output);
  console.log("Wrote config/contracts.js");
}
