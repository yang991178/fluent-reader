# Copilot Instructions — Fluent Reader

## Overview

Fluent Reader is a **modern desktop RSS reader** built with **Electron + React + Redux + TypeScript**. It targets Windows, macOS (including Mac App Store), and Linux. The UI uses Microsoft's **Fluent UI (v7)** component library. Data is stored client-side using **Lovefield** (SQL-like browser DB) and **NeDB**. Articles are parsed with **Mercury Parser** and fetched via **rss-parser**. Settings are persisted with **electron-store**.

The repository is ~80 TypeScript/TSX source files under `src/`. There is no test suite. There is no ESLint — formatting is handled solely by **Prettier**.

## Build & Validate

Always run commands from the repository root.

### Install dependencies

```bash
npm install
```

Run this **before every build**. The lockfile (`package-lock.json`) is gitignored (`.lock` in `.gitignore`), so `npm install` resolves from `package.json` each time.

### Build (compile TypeScript via Webpack)

```bash
npm run build
```

This runs `webpack --config ./webpack.config.js`, which produces three bundles in `dist/`:
- `electron.js` — Electron main process (from `src/electron.ts`)
- `preload.js` — Preload script (from `src/preload.ts`)
- `index.js` + `index.html` — Renderer/React app (from `src/index.tsx`)

Build takes ~30 seconds. A successful build ends with three "compiled successfully" lines — one per webpack config entry.

### Run the app

```bash
npm run electron
```

Or combined install + build + run:

```bash
npm run start
```

### Format check (Prettier)

```bash
npx prettier --check .
```

To auto-fix formatting:

```bash
npm run format
```

**Always run `npx prettier --check .` after making changes** to ensure code style compliance. The Prettier config is in `.prettierrc.yml`: 4-space tabs, no semicolons, JSX bracket on same line, arrow parens avoided, consistent quote props. `.prettierignore` excludes `dist/`, `bin/`, `node_modules/`, HTML, Markdown, and most JSON (except `src/**/*.json`).

### Tests

There is **no test suite** in this project. Validation consists of:
1. `npm run build` — must compile without errors.
2. `npx prettier --check .` — must pass with no formatting violations.

### Packaging (not needed for typical changes)

- Windows: `npm run package-win`
- macOS: `npm run package-mac`
- Linux: `npm run package-linux`
- Mac App Store: `npm run package-mas` (requires provisioning profile and entitlements in `build/`)

## CI/CD

Two GitHub Actions workflows in `.github/workflows/`:

- **`release-main.yml`** — Triggered on version tags (`v*`). Runs on `windows-latest`. Steps: `npm install` → `npm run build` → `npm run package-win-ci`. Uploads `.exe` and `.zip` to a draft GitHub release.
- **`release-linux.yml`** — Triggered when a release is published. Runs on `ubuntu-latest`. Steps: `npm install` → `npm run build` → `npm run package-linux`. Uploads `.AppImage`.

Both CI pipelines run `npm install` then `npm run build`. There are no lint or test steps in CI.

## Project Layout

### Root files
| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts, metadata (v1.1.4) |
| `webpack.config.js` | Three webpack configs: main, preload, renderer |
| `tsconfig.json` | TypeScript: JSX=react, target=ES2019, module=CommonJS, resolveJsonModule |
| `electron-builder.yml` | Electron Builder config for Win/Mac/Linux distribution |
| `electron-builder-mas.yml` | Electron Builder config for Mac App Store |
| `.prettierrc.yml` | Prettier formatting rules |
| `.prettierignore` | Files excluded from Prettier |

### `src/` — All source code

| Path | Description |
|---|---|
| `electron.ts` | **Electron main process** entry. Creates app menu, initializes `WindowManager`. |
| `preload.ts` | **Preload script**. Exposes `settingsBridge` and `utilsBridge` via `contextBridge`. |
| `index.tsx` | **Renderer entry**. Mounts React `<Root>` with Redux `<Provider>`. |
| `schema-types.ts` | Shared TypeScript enums and types (ViewType, ThemeSettings, etc.) |
| `bridges/` | IPC bridges between renderer and main process (`settings.ts`, `utils.ts`). |
| `main/` | Electron main-process modules: `window.ts` (BrowserWindow), `settings.ts` (electron-store + IPC handlers), `utils.ts` (IPC utilities), `touchbar.ts`, `update-scripts.ts`. |
| `scripts/` | Renderer-side logic (runs in browser context). |
| `scripts/reducer.ts` | Root Redux store — combines: sources, items, feeds, groups, page, service, app. |
| `scripts/settings.ts` | Theme management, locale setup, Fluent UI theming. |
| `scripts/db.ts` | Lovefield database schema definitions (sources, items). |
| `scripts/utils.ts` | Shared utilities and type helpers. |
| `scripts/models/` | Redux slices: `app.ts`, `feed.ts`, `group.ts`, `item.ts`, `page.ts`, `rule.ts`, `service.ts`, `source.ts`, plus `services/` for RSS service integrations. |
| `scripts/i18n/` | Internationalization. `_locales.ts` maps locale codes to JSON files. 19 languages. Translations are JSON files (e.g., `en-US.json`). Uses `react-intl-universal`. |
| `components/` | React UI components. `root.tsx` is the top-level layout. Sub-dirs: `cards/` (article card variants), `feeds/` (feed list views), `settings/` (settings panels), `utils/` (shared UI helpers). |
| `containers/` | Redux-connected container components that map state/dispatch to component props. |

### `dist/` — Build output + static assets

The `dist/` directory contains **both webpack output and checked-in static assets**. Files like `dist/icons/`, `dist/article/`, `dist/styles/`, `dist/index.css`, `dist/fonts.vbs`, and `dist/fontlist` are static and tracked in git. The webpack-generated files (`*.js`, `*.js.map`, `*.html`, `*.LICENSE.txt`) are gitignored.

### `build/` — Packaging resources

Contains app icons (`build/icons/`), macOS entitlements plists, provisioning profiles, and `resignAndPackage.sh` for Mac App Store builds. Also has `build/appx/` for Windows Store assets.

## Architecture Notes

- **IPC pattern**: The renderer never imports Electron directly. All Electron APIs are accessed through `src/bridges/` which are exposed via `contextBridge` in `preload.ts`. Settings state flows: renderer → bridge (ipcRenderer) → main/settings.ts (ipcMain handlers) → electron-store.
- **State management**: Redux with `redux-thunk` for async actions. The store shape is defined by `RootState` in `scripts/reducer.ts`. Each model file in `scripts/models/` exports its own reducer, action types, and thunk action creators.
- **i18n**: To add or modify translations, edit JSON files in `src/scripts/i18n/`. Register new locales in `_locales.ts`.
- **RSS service integrations**: Located in `src/scripts/models/services/` (logic) and `src/components/settings/services/` (UI). Supported: Fever, Google Reader API (GReader), Inoreader, Feedbin, Miniflux, Nextcloud.

## Key Conventions

- All source is TypeScript (`.ts`/`.tsx`). No plain JavaScript in `src/`.
- No semicolons. 4-space indentation. See `.prettierrc.yml`.
- Enums use `const enum` pattern in `schema-types.ts`.
- Components use both class components and function components (no strict rule).
- Redux containers in `containers/` use `connect()` from react-redux.

## Validation Checklist

After any code change, always run:
```bash
npm install && npm run build && npx prettier --check .
```
All three must succeed. If the build fails, fix TypeScript errors. If prettier fails, run `npm run format` then verify.

Trust these instructions. Only search the codebase if information here is incomplete or found to be incorrect.
