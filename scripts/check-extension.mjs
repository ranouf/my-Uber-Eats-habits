import { access, readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const packageInfo = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
if (
  manifest.manifest_version !== 3 ||
  [packageInfo.version, lock.version, lock.packages[""].version].some(
    (version) => version !== manifest.version,
  )
) {
  throw new Error("Le manifeste doit être en version 3 et partager la version des fichiers npm.");
}
await Promise.all(
  [
    ...manifest.content_scripts.flatMap((script) => script.js),
    ...manifest.web_accessible_resources.flatMap((entry) => entry.resources),
  ].map((file) => access(file)),
);
console.log("Manifest V3 et fichiers de l'extension valides.");
