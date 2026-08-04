# Response Instructions + Write For Me — Lumiverse

Port of [bumyann/sillytavern-response-instructions](https://github.com/bumyann/sillytavern-response-instructions) for **Lumiverse** via the Spindle extension framework.

Same features, same vibe, native to Lumiverse's API.

---

## Features

### 📜 Response Instructions
- Inject a steering instruction into the prompt before every AI reply
- **No character limit**
- Toggle ON/OFF with a green dot indicator
- Preset library — save, load, delete named instruction sets
- Injected as a system message near the last user message (mirrors ST's Author's Note depth)
- Persists until you clear it

### 🪄 Write For Me
- AI drafts a message for you using your active connection + model
- Optional steering instruction
- Browse multiple drafts with ← → navigation
- Edit directly before using
- **Use this** pushes the draft into the chat input
- Separate preset library for WFM instructions

---

## Installation

1. In Lumiverse, open **Extensions** → **Install extension**
2. Paste: `https://github.com/bumyann/lumiverse-response-instructions`
3. Click **Install** — Lumiverse auto-builds from `src/`
4. Enable the extension in the Extensions list

> Lumiverse will auto-build `dist/backend.js` and `dist/frontend.js` from `src/` on install if the `dist/` folder is absent.

---

## How It Works

The UI mounts as a collapsible **bottom dock panel** (since Lumiverse doesn't have a fixed "above chat input" slot). Click **Instructions** or **Write For Me** in the tab row to expand the panel.

**Response Instructions**
- Backend registers a `spindle.registerInterceptor` that runs at priority 10
- When enabled, it splices a `{ role: 'system', content: '[Response Instructions] ...' }` message just before the last user message in the assembled prompt array
- This mirrors ST's Author's Note injection position
- The interceptor is a no-op when the toggle is OFF or the textarea is empty — zero overhead

**Write For Me**
- Frontend sends the instruction to the backend via `ctx.sendToBackend`
- Backend runs `spindle.generate.quiet(...)` using your active connection
- Draft is returned and displayed; navigate with ← →

**Presets**
- Stored via `spindle.storage.setJson` (backend), fully persisted across sessions
- Separate files for RI presets (`presets_ri.json`) and WFM presets (`presets_wfm.json`)

---

## Permissions Required

| Permission  | Why                                              |
|-------------|--------------------------------------------------|
| `interceptor` | Inject instruction into pre-LLM message array |
| `generation`  | Write For Me AI drafting                       |
| `storage`     | Persist presets between sessions               |

---

## Differences from the ST Version

| ST Version | Lumiverse Version |
|---|---|
| STscript `/inject` at Author's Note depth | `registerInterceptor` splice before last user message |
| jQuery DOM injection above chat input | Bottom dock panel (collapsible) |
| `localStorage` / ST settings | `spindle.storage` JSON files |
| Uses currently connected ST API | Uses active Lumiverse connection via `generate.quiet` |
| ST theme vars (`--SmartTheme*`) | Lumiverse theme vars (`--lumiverse-*`) |

---

## Notes

- **Write For Me chat context:** The ST version had direct access to the chat history DOM/context. Lumiverse's frontend `ctx` doesn't expose chat history directly; the backend uses `generate.quiet` which automatically includes the active chat context via Lumiverse's native assembly. This means WFM is aware of the conversation — it just works differently under the hood.
- **"Use this" fallback:** If Lumiverse's chat input selector isn't found, the draft is copied to clipboard instead.

---

MIT License — bumyann
