// Patches @griffel/webpack-plugin to fix a Windows path issue when the project
// path contains spaces. The ESM file uses `new URL(import.meta.url).pathname`
// which returns a URL-encoded string (e.g. %20 for spaces) on Windows, causing
// webpack to fail to resolve the virtual loader. `fileURLToPath` decodes it correctly.
const fs = require("node:fs")
const path = require("node:path")

const filePath = path.join(
    __dirname,
    "node_modules",
    "@griffel",
    "webpack-plugin",
    "src",
    "webpackLoader.mjs"
)

if (!fs.existsSync(filePath)) {
    console.warn("patch-griffel.js: file not found, skipping patch:", filePath)
    process.exit(0)
}

let content = fs.readFileSync(filePath, "utf8")

if (content.includes("fileURLToPath")) {
    console.log("patch-griffel.js: already patched, skipping.")
    process.exit(0)
}

content = content.replace(
    `import * as path from 'node:path';`,
    `import * as path from 'node:path';\nimport { fileURLToPath } from 'node:url';`
)
content = content.replace(
    `const __dirname = path.dirname(new URL(import.meta.url).pathname);`,
    `const __dirname = path.dirname(fileURLToPath(import.meta.url));`
)

fs.writeFileSync(filePath, content, "utf8")
console.log(
    "patch-griffel.js: patched @griffel/webpack-plugin for Windows compatibility."
)
