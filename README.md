# Response Instructions + Write For Me — Lumiverse

Port of [bumyann/sillytavern-response-instructions](https://github.com/bumyann/sillytavern-response-instructions) for **Lumiverse** via the Spindle framework.

## Features

**📜 Response Instructions** — inject a steering instruction into the prompt before every AI reply. No character limit. Toggle ON/OFF with a green dot indicator. Preset library.

**🪄 Write For Me** — AI drafts a message for you using your active connection. Optional steering, browse multiple drafts, edit before sending.

## Install

1. Push this repo to GitHub (update `github` and `homepage` in `spindle.json` to your URL)
2. Lumiverse → Extensions → Install Extension → paste your repo URL
3. Grant the requested permissions (`interceptor`, `generation`)
4. Look for the **✦** button on the page — tap it to open the RI + WFM drawer tab

## Usage

- **✦ button** — draggable, snaps to screen edges, tap to open the drawer tab
- **Instructions tab** — type your instruction, toggle ON, send as normal
- **Write For Me tab** — optionally add a direction, hit Generate, browse drafts, Use this
- **📁** — open the preset library to save/load/delete named presets
- **🗑** — clear the current instruction and disable

## Permissions

| Permission | Why |
|---|---|
| `interceptor` | Inject instruction into the prompt before the LLM call |
| `generation` | Write For Me AI drafting |

Storage is free-tier — no permission needed.
