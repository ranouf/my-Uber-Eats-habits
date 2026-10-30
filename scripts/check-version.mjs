import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const base = process.argv[2] ?? "HEAD";
const previous = JSON.parse(
  execFileSync("git", ["show", `${base}:manifest.json`], { encoding: "utf8" }),
);
const current = JSON.parse(await readFile("manifest.json", "utf8"));
if (current.version.localeCompare(previous.version, "en", { numeric: true }) <= 0) {
  throw new Error(`La version doit dépasser ${previous.version}. Exécuter npm run version:bump.`);
}
console.log(`Version augmentée : ${previous.version} → ${current.version}`);
