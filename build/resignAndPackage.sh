#!/usr/bin/env bash
set -euo pipefail

APP="Fluent Reader"
APP_DIR="bin/darwin/universal/mas-universal"
APP_PATH="$APP_DIR/$APP.app"
PACKAGE_PATH="$APP_DIR/$APP-mac_store.pkg"
RESULT_PATH="bin/$APP-mac_store.pkg"

# Electron Builder signs nested binaries, including SQLite, before the app.
# The MAS config supplies ElectronTeamID and the existing sandbox entitlements.
# Electron Builder also signs the installer with the MAS certificate.
npx electron-builder -c electron-builder-mas.yml --mac mas:universal --publish never

codesign --verify --deep --strict "$APP_PATH"
node - "$APP_PATH" <<'NODE'
const { execFileSync } = require("node:child_process")
const { isDeepStrictEqual } = require("node:util")
const expected = JSON.parse(execFileSync("plutil", [
    "-convert", "json", "-o", "-", "build/entitlements.mas.plist",
]))
const signed = execFileSync("codesign", [
    "-d", "--entitlements", "-", "--xml", process.argv[2],
], { stdio: ["ignore", "pipe", "ignore"] })
const actual = JSON.parse(execFileSync("plutil", [
    "-convert", "json", "-o", "-", "-",
], { input: signed }))
if (!isDeepStrictEqual(actual, expected)) {
    throw new Error("Signed MAS entitlements do not match build/entitlements.mas.plist")
}
NODE
pkgutil --check-signature "$PACKAGE_PATH"
cp "$PACKAGE_PATH" "$RESULT_PATH"

printf '\nSigned Mac App Store package: %s\n' "$RESULT_PATH"
