const { createHash } = require("node:crypto")
const { readFileSync, writeFileSync } = require("node:fs")
const path = require("node:path")

const articleDirectory = path.join(__dirname, "../dist/article")
const htmlPath = path.join(articleDirectory, "article.html")
const script = readFileSync(
    require.resolve("@jocmp/mercury-parser/dist/mercury.web.js")
)
const html = readFileSync(htmlPath, "utf8")
const scriptTag = html.match(
    /<script\b[^>]*\bsrc="mercury\.web\.js"[^>]*>/
)?.[0]
const oldIntegrity = scriptTag?.match(/\bintegrity="([^"]+)"/)?.[1]

if (!oldIntegrity || !html.includes(`'${oldIntegrity}'`)) {
    throw new Error("Cannot find the Mercury integrity attribute and CSP hash")
}

const integrity = `sha256-${createHash("sha256")
    .update(script)
    .digest("base64")}`
const updatedHtml = html
    .replace(scriptTag, scriptTag.replace(oldIntegrity, integrity))
    .replace(`'${oldIntegrity}'`, `'${integrity}'`)

writeFileSync(path.join(articleDirectory, "mercury.web.js"), script)
writeFileSync(htmlPath, updatedHtml)
