import { defineConfig } from "drizzle-kit"

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./dist/drizzle",
    dialect: "sqlite",
})
