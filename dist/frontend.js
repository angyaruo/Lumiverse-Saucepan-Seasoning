// Response Instructions + Write For Me — frontend

// ─── SVG icons (Lucide style, 14×14 stroke) ──────────────────────────────────
const IC = {
  // scroll / file-text → RI
  ri:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  // wand-2 → WFM
  wfm:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>`,
  // folder → presets
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  // trash-2 → clear/delete
  trash:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  // x → close
  close:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  // bookmark → save draft
  save:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  // bookmark-check → saved
  saved:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><path d="m9 10 2 2 4-4"/></svg>`,
  // list → saved drafts tab
  list:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  // chevron-left / right for nav
  prev:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  next:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  // zap → generate
  gen:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  // check → use this
  use:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
};

export function setup(ctx) {

  let state = {
    instruction: '', enabled: false, presets: {}, wfm_direction: '', saved_drafts: [],
    ri_mode: 'simple', // 'simple' | 'custom'
    simple: {
      own: '', length: '', style: '', speak_for: '', intimacy: '', pacing: '', narration: '',
    },
  };
  let panelOpen = false, activeTab = 'ri';
  let drafts = [], draftIdx = 0, generating = false;
  let wfmView = 'generate'; // 'generate' | 'saved'

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const removeStyle = ctx.dom.addStyle(`
    #ri-toolbar {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 8px; flex-shrink: 0; box-sizing: border-box;
      border-top: 1px solid var(--lumiverse-border);
    }
    .ri-icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 5px;
      border: 1px solid transparent; background: transparent;
      color: var(--lumiverse-text-dim); cursor: pointer; flex-shrink: 0;
      position: relative; transition: background 0.13s, color 0.13s, border-color 0.13s;
    }
    .ri-icon-btn:hover { background: var(--lumiverse-fill); color: var(--lumiverse-text); }
    .ri-icon-btn.ri-on {
      border-color: var(--lumiverse-accent); color: var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 12%, transparent);
    }
    .ri-dot {
      position: absolute; top: 4px; right: 4px;
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--lumiverse-accent); box-shadow: 0 0 4px var(--lumiverse-accent);
      display: none;
    }
    .ri-icon-btn.ri-enabled .ri-dot { display: block; }
    #ri-divider { width: 1px; height: 16px; background: var(--lumiverse-border); margin: 0 2px; flex-shrink: 0; }

    #ri-panel {
      overflow: hidden; max-height: 0; opacity: 0;
      transition: max-height 0.22s ease, opacity 0.16s ease;
      background: var(--lumiverse-fill); border-top: 1px solid var(--lumiverse-border); flex-shrink: 0;
    }
    #ri-panel.ri-open { max-height: 420px; opacity: 1; }

    .ri-header {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 10px; border-bottom: 1px solid var(--lumiverse-border);
      font-size: 10.5px; font-weight: 700; letter-spacing: 0.07em;
      text-transform: uppercase; color: var(--lumiverse-text-muted);
    }
    .ri-header-icon { display: flex; align-items: center; opacity: 0.7; }
    .ri-header-title { flex: 1; }
    .ri-hbtn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 4px; background: none; border: none;
      color: var(--lumiverse-text-dim); cursor: pointer;
      transition: color 0.12s, background 0.12s;
    }
    .ri-hbtn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
    .ri-hbtn.ri-on { color: var(--lumiverse-accent); }

    .ri-toggle { position: relative; width: 28px; height: 15px; flex-shrink: 0; cursor: pointer; }
    .ri-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .ri-toggle-track {
      position: absolute; inset: 0; border-radius: 8px;
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      transition: background 0.18s, border-color 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-track {
      background: color-mix(in srgb, var(--lumiverse-accent) 30%, transparent);
      border-color: var(--lumiverse-accent);
    }
    .ri-toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 9px; height: 9px;
      border-radius: 50%; background: var(--lumiverse-text-dim); transition: transform 0.18s, background 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-thumb { transform: translateX(13px); background: var(--lumiverse-accent); }

    .ri-body { padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; }

    .ri-ta {
      width: 100%; box-sizing: border-box; resize: vertical;
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); color: var(--lumiverse-text);
      font-size: 12.5px; font-family: inherit; padding: 6px 9px; outline: none;
      transition: border-color 0.14s;
    }
    .ri-ta:focus { border-color: var(--lumiverse-accent); }
    #ri-instr-ta { min-height: 72px; }
    #ri-dir-ta   { min-height: 40px; }

    .ri-label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--lumiverse-text-dim); margin-bottom: 3px; font-weight: 600;
    }
    .ri-preview {
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); padding: 6px 9px;
      font-size: 12px; color: var(--lumiverse-text-muted);
      max-height: 64px; overflow-y: auto; white-space: pre-wrap; word-break: break-word;
    }

    /* draft nav */
    .ri-draft-nav {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: 11.5px; color: var(--lumiverse-text-muted);
    }
    .ri-nav-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 4px; background: none; border: none;
      color: var(--lumiverse-text-dim); cursor: pointer; transition: color 0.12s, background 0.12s;
    }
    .ri-nav-btn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
    .ri-nav-btn:disabled { opacity: 0.28; cursor: default; pointer-events: none; }

    /* current draft display */
    .ri-draft-box {
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); padding: 7px 9px;
      font-size: 12.5px; color: var(--lumiverse-text);
      max-height: 80px; overflow-y: auto; white-space: pre-wrap; word-break: break-word;
      display: none;
    }
    .ri-draft-box.ri-visible { display: block; }

    .ri-wfm-actions { display: flex; gap: 6px; align-items: center; }
    .ri-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 5px;
      padding: 5px 10px; border-radius: var(--lumiverse-radius);
      font-size: 12px; font-family: inherit; cursor: pointer;
      transition: background 0.13s, border-color 0.13s; line-height: 1; flex: 1;
    }
    .ri-btn-gen {
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle); color: var(--lumiverse-text-muted);
    }
    .ri-btn-gen:hover:not(:disabled) { background: var(--lumiverse-fill); color: var(--lumiverse-text); }
    .ri-btn-use {
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent);
    }
    .ri-btn-use:hover:not(:disabled) { background: color-mix(in srgb, var(--lumiverse-accent) 26%, transparent); }
    .ri-btn:disabled { opacity: 0.38; cursor: default; }
    /* save current draft btn — icon only, sits next to nav */
    .ri-save-draft-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 4px; background: none; border: none;
      color: var(--lumiverse-text-dim); cursor: pointer; transition: color 0.12s, background 0.12s;
    }
    .ri-save-draft-btn:hover { color: var(--lumiverse-accent); background: var(--lumiverse-fill-subtle); }
    .ri-save-draft-btn:disabled { opacity: 0.28; cursor: default; pointer-events: none; }

    .ri-status { font-size: 11px; color: var(--lumiverse-text-dim); text-align: center; min-height: 13px; }

    /* WFM view tabs */
    .ri-wfm-tabs {
      display: flex; gap: 3px;
    }
    .ri-wfm-tab {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 4px; font-size: 11.5px;
      background: none; border: none; color: var(--lumiverse-text-dim);
      cursor: pointer; transition: color 0.12s, background 0.12s; font-family: inherit;
    }
    .ri-wfm-tab:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
    .ri-wfm-tab.ri-on { color: var(--lumiverse-accent); background: color-mix(in srgb, var(--lumiverse-accent) 10%, transparent); }

    /* saved drafts list */
    .ri-saved-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
    .ri-saved-item {
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); padding: 6px 9px; font-size: 12px;
      color: var(--lumiverse-text); white-space: pre-wrap; word-break: break-word;
      max-height: 60px; overflow: hidden; position: relative;
    }
    .ri-saved-item-actions {
      display: flex; gap: 4px; margin-top: 4px;
    }
    .ri-saved-act {
      display: inline-flex; align-items: center; gap: 3px;
      background: none; border: 1px solid var(--lumiverse-border); border-radius: 3px;
      color: var(--lumiverse-text-muted); font-size: 11px; font-family: inherit;
      cursor: pointer; padding: 1px 6px; transition: color 0.12s, border-color 0.12s;
    }
    .ri-saved-act:hover { color: var(--lumiverse-accent); border-color: var(--lumiverse-accent); }
    .ri-saved-del:hover { color: #f87171; border-color: #f87171; }
    .ri-empty { font-size: 11.5px; color: var(--lumiverse-text-dim); padding: 8px 4px; text-align: center; }

    /* simple mode */
    .ri-mode-tabs {
      display: flex; gap: 2px; padding: 5px 10px 0;
      border-bottom: 1px solid var(--lumiverse-border);
    }
    .ri-mode-tab {
      padding: 3px 10px; border-radius: 4px 4px 0 0; font-size: 11.5px; font-family: inherit;
      background: none; border: 1px solid transparent; border-bottom: none;
      color: var(--lumiverse-text-dim); cursor: pointer;
      transition: color 0.12s, background 0.12s;
    }
    .ri-mode-tab:hover { color: var(--lumiverse-text); }
    .ri-mode-tab.ri-on {
      color: var(--lumiverse-accent); background: var(--lumiverse-fill);
      border-color: var(--lumiverse-border);
    }
    .ri-simple-body {
      padding: 8px 10px; display: flex; flex-direction: column; gap: 10px;
      max-height: 260px; overflow-y: auto;
    }
    .ri-field { display: flex; flex-direction: column; gap: 4px; }
    .ri-field-label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em;
      color: var(--lumiverse-text-dim); font-weight: 600;
    }
    .ri-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .ri-chip {
      padding: 2px 10px; border-radius: 20px; font-size: 11.5px; font-family: inherit;
      border: 1px solid var(--lumiverse-border); background: transparent;
      color: var(--lumiverse-text-muted); cursor: pointer;
      transition: color 0.12s, border-color 0.12s, background 0.12s;
    }
    .ri-chip:hover { border-color: var(--lumiverse-accent); color: var(--lumiverse-text); }
    .ri-chip.ri-on {
      border-color: var(--lumiverse-accent); color: var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 12%, transparent);
      font-weight: 600;
    }
    .ri-simple-ta {
      width: 100%; box-sizing: border-box; min-height: 44px; resize: vertical;
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); color: var(--lumiverse-text);
      font-size: 12px; font-family: inherit; padding: 5px 8px; outline: none;
      transition: border-color 0.14s;
    }
    .ri-simple-ta:focus { border-color: var(--lumiverse-accent); }
    .ri-composed-preview {
      font-size: 11px; color: var(--lumiverse-text-dim); font-style: italic;
      padding: 4px 0 0; min-height: 14px; line-height: 1.4;
    }

    /* presets modal */
    .ri-preset-list { display: flex; flex-direction: column; gap: 3px; max-height: 200px; overflow-y: auto; }
    .ri-preset-row {
      display: flex; align-items: center; gap: 6px; padding: 5px 8px;
      border-radius: var(--lumiverse-radius); cursor: pointer; font-size: 12.5px;
      color: var(--lumiverse-text); transition: background 0.12s;
    }
    .ri-preset-row:hover { background: var(--lumiverse-fill-subtle); }
    .ri-preset-del {
      margin-left: auto; background: none; border: none;
      color: var(--lumiverse-text-dim); cursor: pointer; display: flex; align-items: center;
    }
    .ri-preset-del:hover { color: #f87171; }
    .ri-preset-save { display: flex; gap: 6px; margin-top: 8px; }
    .ri-preset-save input {
      flex: 1; background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); color: var(--lumiverse-text);
      font-size: 12px; font-family: inherit; padding: 5px 8px; outline: none;
    }
    .ri-preset-save input:focus { border-color: var(--lumiverse-accent); }
    .ri-preset-save button {
      padding: 5px 10px; border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent); font-size: 12px; font-family: inherit; cursor: pointer;
    }
  `);

  // ─── Toolbar ──────────────────────────────────────────────────────────────────
  function buildToolbar() {
    const el = document.createElement('div');
    el.id = 'ri-toolbar';
    el.innerHTML = `
      <button class="ri-icon-btn" id="ri-btn-ri" title="Response Instructions">
        ${IC.ri}<span class="ri-dot"></span>
      </button>
      <div id="ri-divider"></div>
      <button class="ri-icon-btn" id="ri-btn-wfm" title="Write For Me">${IC.wfm}</button>
    `;
    el.querySelector('#ri-btn-ri').onclick  = () => togglePanel('ri');
    el.querySelector('#ri-btn-wfm').onclick = () => togglePanel('wfm');
    return el;
  }

  // ─── Panel ────────────────────────────────────────────────────────────────────
  function buildPanel() {
    const el = document.createElement('div');
    el.id = 'ri-panel';
    el.innerHTML = `
      <!-- RI tab -->
      <div id="ri-tab-ri">
        <div class="ri-header">
          <span class="ri-header-icon">${IC.ri}</span>
          <span class="ri-header-title">Response Instructions</span>
          <label class="ri-toggle" title="Enable">
            <input type="checkbox" id="ri-chk">
            <span class="ri-toggle-track"></span>
            <span class="ri-toggle-thumb"></span>
          </label>
          <button class="ri-hbtn" id="ri-preset-btn" title="Presets">${IC.folder}</button>
          <button class="ri-hbtn" id="ri-clear-btn" title="Clear">${IC.trash}</button>
          <button class="ri-hbtn" id="ri-close-ri"  title="Close">${IC.close}</button>
        </div>
        <!-- Simple / Custom mode tabs -->
        <div class="ri-mode-tabs">
          <button class="ri-mode-tab ri-on" id="ri-mode-simple">Simple</button>
          <button class="ri-mode-tab" id="ri-mode-custom">Custom</button>
        </div>

        <!-- Simple mode -->
        <div class="ri-simple-body" id="ri-simple-body">
          <div class="ri-field">
            <div class="ri-field-label">Your own instructions</div>
            <textarea class="ri-simple-ta" id="ri-simple-own" placeholder="Anything else? e.g. {{companion}} loses his memories"></textarea>
          </div>
          <div class="ri-field">
            <div class="ri-field-label">Length</div>
            <div class="ri-chips" data-field="length">
              <button class="ri-chip ri-on" data-val="">Default</button>
              <button class="ri-chip" data-val="short">Short</button>
              <button class="ri-chip" data-val="medium">Medium</button>
              <button class="ri-chip" data-val="long">Long</button>
              <button class="ri-chip" data-val="essay">Essay</button>
              <button class="ri-chip" data-val="ramble">Ramble</button>
            </div>
          </div>
          <div class="ri-field">
            <div class="ri-field-label">Style</div>
            <div class="ri-chips" data-field="style">
              <button class="ri-chip ri-on" data-val="">Default</button>
              <button class="ri-chip" data-val="first person">First Person</button>
              <button class="ri-chip" data-val="second person">Second Person</button>
              <button class="ri-chip" data-val="third person">Third Person</button>
              <button class="ri-chip" data-val="text messaging style">Text Messaging</button>
            </div>
          </div>
          <div class="ri-field">
            <div class="ri-field-label">Speak For</div>
            <div class="ri-chips" data-field="speak_for">
              <button class="ri-chip ri-on" data-val="">Default</button>
              <button class="ri-chip" data-val="companion only">Companion only</button>
              <button class="ri-chip" data-val="both characters">Both</button>
            </div>
          </div>
          <div class="ri-field">
            <div class="ri-field-label">Intimacy</div>
            <div class="ri-chips" data-field="intimacy">
              <button class="ri-chip ri-on" data-val="">Default</button>
              <button class="ri-chip" data-val="platonic">Platonic</button>
              <button class="ri-chip" data-val="romantic">Romantic</button>
              <button class="ri-chip" data-val="sexual">Sexual</button>
              <button class="ri-chip" data-val="explicit">Explicit</button>
            </div>
          </div>
          <div class="ri-field">
            <div class="ri-field-label">Story Pacing</div>
            <div class="ri-chips" data-field="pacing">
              <button class="ri-chip ri-on" data-val="">Default</button>
              <button class="ri-chip" data-val="slow">Slow</button>
              <button class="ri-chip" data-val="fast">Fast</button>
            </div>
          </div>
          <div class="ri-field">
            <div class="ri-field-label">Narration vs Dialogue</div>
            <div class="ri-chips" data-field="narration">
              <button class="ri-chip ri-on" data-val="">Default</button>
              <button class="ri-chip" data-val="narration-focused">Narration</button>
              <button class="ri-chip" data-val="balanced narration and dialogue">Balanced</button>
              <button class="ri-chip" data-val="dialogue-focused">Dialogue</button>
            </div>
          </div>
          <div class="ri-composed-preview" id="ri-composed-preview"></div>
        </div>

        <!-- Custom mode -->
        <div class="ri-body" id="ri-custom-body" style="display:none;">
          <textarea class="ri-ta" id="ri-instr-ta" placeholder="Write response instructions here… injected into the next prompt."></textarea>
        </div>
      </div>

      <!-- WFM tab -->
      <div id="ri-tab-wfm" style="display:none;">
        <div class="ri-header">
          <span class="ri-header-icon">${IC.wfm}</span>
          <span class="ri-header-title">Write For Me</span>
          <div class="ri-wfm-tabs">
            <button class="ri-wfm-tab ri-on" id="ri-wfm-tab-gen">${IC.wfm} Generate</button>
            <button class="ri-wfm-tab" id="ri-wfm-tab-saved">${IC.list} Saved</button>
          </div>
          <button class="ri-hbtn" id="ri-close-wfm" title="Close">${IC.close}</button>
        </div>

        <!-- generate view -->
        <div class="ri-body" id="ri-wfm-gen">
          <div>
            <div class="ri-label">Your message</div>
            <div class="ri-preview" id="ri-preview">(empty)</div>
          </div>
          <div class="ri-draft-nav">
            <button class="ri-nav-btn" id="ri-prev" title="Previous draft">${IC.prev}</button>
            <span id="ri-draft-label">No drafts</span>
            <button class="ri-nav-btn" id="ri-next" title="Next draft">${IC.next}</button>
            <button class="ri-save-draft-btn" id="ri-save-draft" title="Save this draft" disabled>${IC.save}</button>
          </div>
          <div class="ri-draft-box" id="ri-draft-box"></div>
          <div>
            <div class="ri-label">Instruction</div>
            <textarea class="ri-ta" id="ri-dir-ta" placeholder="e.g. 'act shy', 'confess feelings', 'change the subject'…"></textarea>
          </div>
          <div class="ri-wfm-actions">
            <button class="ri-btn ri-btn-gen" id="ri-gen">${IC.gen} Generate</button>
            <button class="ri-btn ri-btn-use" id="ri-use" disabled>${IC.use} Use this</button>
          </div>
          <div class="ri-status" id="ri-status"></div>
        </div>

        <!-- saved drafts view -->
        <div class="ri-body" id="ri-wfm-saved" style="display:none;">
          <div class="ri-saved-list" id="ri-saved-list"></div>
        </div>
      </div>
    `;

    // RI wiring
    const ta  = el.querySelector('#ri-instr-ta');
    const chk = el.querySelector('#ri-chk');
    ta.oninput   = () => { state.instruction = ta.value; push(); };
    chk.onchange = () => { state.enabled = chk.checked; refreshRiBtn(); push(); };
    el.querySelector('#ri-clear-btn').onclick = () => {
      if (state.ri_mode === 'custom') {
        state.instruction = '';
        if (ta) ta.value = '';
      } else {
        state.simple = { own: '', length: '', style: '', speak_for: '', intimacy: '', pacing: '', narration: '' };
        applySimpleToUI();
      }
      state.enabled = false;
      if (chk) chk.checked = false;
      refreshRiBtn(); push();
    };
    // Mode tab switching
    el.querySelector('#ri-mode-simple').onclick = () => setRiMode('simple');
    el.querySelector('#ri-mode-custom').onclick  = () => setRiMode('custom');

    // Simple mode — chip groups
    el.querySelectorAll('.ri-chips').forEach(group => {
      group.querySelectorAll('.ri-chip').forEach(chip => {
        chip.onclick = () => {
          group.querySelectorAll('.ri-chip').forEach(c => c.classList.remove('ri-on'));
          chip.classList.add('ri-on');
          state.simple[group.dataset.field] = chip.dataset.val;
          updateComposedPreview();
          push();
        };
      });
    });

    // Simple mode — own instructions textarea
    el.querySelector('#ri-simple-own').oninput = (e) => {
      state.simple.own = e.target.value;
      updateComposedPreview();
      push();
    };

    el.querySelector('#ri-preset-btn').onclick = openPresets;
    el.querySelector('#ri-close-ri').onclick   = closePanel;
    el.querySelector('#ri-close-wfm').onclick  = closePanel;

    // WFM view tab switching
    el.querySelector('#ri-wfm-tab-gen').onclick   = () => setWfmView('generate');
    el.querySelector('#ri-wfm-tab-saved').onclick = () => setWfmView('saved');

    // WFM generate wiring
    el.querySelector('#ri-dir-ta').oninput = (e) => { state.wfm_direction = e.target.value; };
    el.querySelector('#ri-gen').onclick     = generate;
    el.querySelector('#ri-use').onclick     = () => { if (drafts[draftIdx]) insertDraft(drafts[draftIdx]); };
    el.querySelector('#ri-prev').onclick    = () => { if (draftIdx > 0) { draftIdx--; renderDraftNav(); } };
    el.querySelector('#ri-next').onclick    = () => { if (draftIdx < drafts.length - 1) { draftIdx++; renderDraftNav(); } };
    el.querySelector('#ri-save-draft').onclick = () => {
      const text = drafts[draftIdx];
      if (!text) return;
      if (!state.saved_drafts.includes(text)) {
        state.saved_drafts = [text, ...state.saved_drafts];
        push();
      }
      // flash button to confirm
      const btn = el.querySelector('#ri-save-draft');
      btn.innerHTML = IC.saved;
      setTimeout(() => { btn.innerHTML = IC.save; }, 1200);
    };

    return el;
  }

  // ─── WFM view toggle ─────────────────────────────────────────────────────────
  function setWfmView(view) {
    wfmView = view;
    document.getElementById('ri-wfm-gen').style.display   = view === 'generate' ? 'flex' : 'none';
    document.getElementById('ri-wfm-saved').style.display = view === 'saved'    ? 'flex' : 'none';
    document.getElementById('ri-wfm-tab-gen').classList.toggle('ri-on',   view === 'generate');
    document.getElementById('ri-wfm-tab-saved').classList.toggle('ri-on', view === 'saved');
    if (view === 'saved') renderSavedList();
  }

  function renderSavedList() {
    const container = document.getElementById('ri-saved-list');
    if (!container) return;
    container.innerHTML = '';
    if (!state.saved_drafts.length) {
      container.innerHTML = `<div class="ri-empty">No saved drafts yet.<br>Generate one and hit ${IC.save} to save it.</div>`;
      return;
    }
    state.saved_drafts.forEach((text, i) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="ri-saved-item">${esc(text)}</div>
        <div class="ri-saved-item-actions">
          <button class="ri-saved-act">${IC.use} Use</button>
          <button class="ri-saved-act ri-saved-del">${IC.trash} Delete</button>
        </div>
      `;
      wrap.querySelector('.ri-saved-act:not(.ri-saved-del)').onclick = () => insertDraft(text);
      wrap.querySelector('.ri-saved-del').onclick = () => {
        state.saved_drafts.splice(i, 1);
        push();
        renderSavedList();
      };
      container.appendChild(wrap);
    });
  }

  // ─── Draft nav ────────────────────────────────────────────────────────────────
  function renderDraftNav() {
    const label    = document.getElementById('ri-draft-label');
    const useBtn   = document.getElementById('ri-use');
    const prevBtn  = document.getElementById('ri-prev');
    const nextBtn  = document.getElementById('ri-next');
    const saveBtn  = document.getElementById('ri-save-draft');
    const draftBox = document.getElementById('ri-draft-box');
    if (!label) return;

    if (!drafts.length) {
      label.textContent = 'No drafts';
      [useBtn, prevBtn, nextBtn, saveBtn].forEach(b => b && (b.disabled = true));
      if (draftBox) draftBox.classList.remove('ri-visible');
      return;
    }
    label.textContent = `Draft ${draftIdx + 1} / ${drafts.length}`;
    if (useBtn)  useBtn.disabled  = false;
    if (saveBtn) saveBtn.disabled = false;
    if (prevBtn) prevBtn.disabled = draftIdx === 0;
    if (nextBtn) nextBtn.disabled = draftIdx === drafts.length - 1;
    if (draftBox) {
      draftBox.textContent = drafts[draftIdx];
      draftBox.classList.add('ri-visible');
    }
  }

  // ─── Generate ────────────────────────────────────────────────────────────────
  function generate() {
    if (generating) return;
    generating = true;
    const genBtn = document.getElementById('ri-gen');
    const status = document.getElementById('ri-status');
    if (genBtn) { genBtn.disabled = true; genBtn.innerHTML = '…'; }
    if (status) status.textContent = 'Generating…';
    ctx.sendToBackend({ type: 'ri:generate', direction: state.wfm_direction?.trim() || '' });
  }

  function insertDraft(text) {
    const ta = document.querySelector('textarea[name="chat-message"]');
    if (!ta) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(ta, text); else ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    closePanel();
  }

  function updatePreview() {
    const ta = document.querySelector('textarea[name="chat-message"]');
    const preview = document.getElementById('ri-preview');
    if (preview) preview.textContent = ta?.value?.trim() || '(empty)';
  }

  // ─── Panel toggle ─────────────────────────────────────────────────────────────
  function togglePanel(tab) {
    if (panelOpen && activeTab === tab) { closePanel(); return; }
    activeTab = tab;
    panelOpen = true;
    document.getElementById('ri-panel')?.classList.add('ri-open');
    document.getElementById('ri-tab-ri').style.display  = tab === 'ri'  ? 'block' : 'none';
    document.getElementById('ri-tab-wfm').style.display = tab === 'wfm' ? 'block' : 'none';
    if (tab === 'wfm') { updatePreview(); setWfmView(wfmView); }
    refreshBtns();
  }

  function closePanel() {
    panelOpen = false;
    document.getElementById('ri-panel')?.classList.remove('ri-open');
    refreshBtns();
  }

  function refreshRiBtn() {
    const btn = document.getElementById('ri-btn-ri');
    if (!btn) return;
    btn.classList.toggle('ri-on',      panelOpen && activeTab === 'ri');
    btn.classList.toggle('ri-enabled', state.enabled);
  }
  function refreshBtns() {
    refreshRiBtn();
    document.getElementById('ri-btn-wfm')?.classList.toggle('ri-on', panelOpen && activeTab === 'wfm');
  }

  function applyStateToUI() {
    const ta  = document.getElementById('ri-instr-ta');
    const chk = document.getElementById('ri-chk');
    const dir = document.getElementById('ri-dir-ta');
    if (ta)  ta.value    = state.instruction;
    if (chk) chk.checked = state.enabled;
    if (dir) dir.value   = state.wfm_direction;
    setRiMode(state.ri_mode ?? 'simple', true);
    applySimpleToUI();
    refreshRiBtn();
  }

  function applySimpleToUI() {
    const s = state.simple ?? {};
    const own = document.getElementById('ri-simple-own');
    if (own) own.value = s.own ?? '';
    // restore chip selections
    document.querySelectorAll('.ri-chips').forEach(group => {
      const val = s[group.dataset.field] ?? '';
      group.querySelectorAll('.ri-chip').forEach(chip => {
        chip.classList.toggle('ri-on', chip.dataset.val === val);
      });
    });
    updateComposedPreview();
  }

  function setRiMode(mode, silent) {
    state.ri_mode = mode;
    document.getElementById('ri-simple-body').style.display = mode === 'simple' ? 'flex' : 'none';
    document.getElementById('ri-custom-body').style.display = mode === 'custom' ? 'flex' : 'none';
    document.getElementById('ri-mode-simple')?.classList.toggle('ri-on', mode === 'simple');
    document.getElementById('ri-mode-custom')?.classList.toggle('ri-on', mode === 'custom');
    if (!silent) push();
  }

  // Compose natural language instruction from Simple selections
  function composeSimple() {
    const s = state.simple ?? {};
    const parts = [];
    if (s.length)    parts.push(`Keep responses ${s.length} in length.`);
    if (s.style)     parts.push(`Write in ${s.style}.`);
    if (s.speak_for) parts.push(`Speak for ${s.speak_for}.`);
    if (s.intimacy)  parts.push(`Keep the tone ${s.intimacy}.`);
    if (s.pacing)    parts.push(`Use a ${s.pacing} story pace.`);
    if (s.narration) parts.push(`Prefer ${s.narration}.`);
    if (s.own?.trim()) parts.push(s.own.trim());
    return parts.join(' ');
  }

  function updateComposedPreview() {
    const el = document.getElementById('ri-composed-preview');
    if (!el) return;
    const composed = composeSimple();
    el.textContent = composed || 'No instructions set — all fields are default.';
  }

  // Returns the active instruction string based on current mode
  function getActiveInstruction() {
    if ((state.ri_mode ?? 'simple') === 'simple') return composeSimple();
    return state.instruction;
  }

  // ─── Presets modal ────────────────────────────────────────────────────────────
  let presetModal = null;

  function openPresets() {
    presetModal = ctx.ui.showModal({ title: 'Presets', width: 320 });
    renderPresetContent();
    presetModal.onDismiss(() => { presetModal = null; });
  }

  function renderPresetContent() {
    if (!presetModal) return;
    const root = presetModal.root;
    root.innerHTML = '';
    root.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:2px 0;';

    const list = document.createElement('div');
    list.className = 'ri-preset-list';
    const names = Object.keys(state.presets);
    if (!names.length) {
      list.innerHTML = `<div style="font-size:11.5px;color:var(--lumiverse-text-dim);padding:4px 8px;">No presets saved yet.</div>`;
    } else {
      names.forEach(name => {
        const row = document.createElement('div');
        row.className = 'ri-preset-row';
        row.innerHTML = `<span style="flex:1;">${esc(name)}</span><button class="ri-preset-del" title="Delete">${IC.trash}</button>`;
        row.querySelector('span').onclick   = () => { loadPreset(name); presetModal?.dismiss(); };
        row.querySelector('button').onclick = (e) => { e.stopPropagation(); delete state.presets[name]; push(); renderPresetContent(); };
        list.appendChild(row);
      });
    }
    root.appendChild(list);

    const saveRow = document.createElement('div');
    saveRow.className = 'ri-preset-save';
    saveRow.innerHTML = `<input type="text" placeholder="Preset name…"><button>Save current</button>`;
    saveRow.querySelector('button').onclick = () => {
      const input = saveRow.querySelector('input');
      const name  = input.value.trim();
      if (!name) return;
      state.presets[name] = state.instruction;
      input.value = '';
      push(); renderPresetContent();
    };
    root.appendChild(saveRow);
  }

  function loadPreset(name) {
    state.instruction = state.presets[name] ?? '';
    const ta = document.getElementById('ri-instr-ta');
    if (ta) ta.value = state.instruction;
    push();
  }

  // ─── Backend ──────────────────────────────────────────────────────────────────
  function push() {
    ctx.sendToBackend({ type: 'ri:update', ...state, _active_instruction: getActiveInstruction() });
  }

  const unsubMsg = ctx.onBackendMessage((payload) => {
    if (payload.type === 'ri:state') {
      state = { saved_drafts: [], ...state, ...payload.state };
      applyStateToUI();
      ctx.sendToBackend({ type: 'ri:update', ...state });
    }
    if (payload.type === 'ri:draft') {
      generating = false;
      const genBtn = document.getElementById('ri-gen');
      const status = document.getElementById('ri-status');
      if (genBtn) { genBtn.disabled = false; genBtn.innerHTML = `${IC.gen} Generate`; }
      if (payload.error) { if (status) status.textContent = `Error: ${payload.error}`; return; }
      drafts.push(payload.text);
      draftIdx = drafts.length - 1;
      if (status) status.textContent = '';
      renderDraftNav();
    }
  });

  // ─── Mount ────────────────────────────────────────────────────────────────────
  function mount() {
    if (document.getElementById('ri-toolbar')) return;
    const slot      = document.querySelector('[data-spindle-mount="chat_composer_above"]');
    if (!slot) return;
    const inputArea = slot.closest('[data-component="InputArea"]');
    if (!inputArea) return;
    const inputRow  = inputArea.querySelector('[class*="_inputRow_"]');
    if (!inputRow) return;

    const toolbar = buildToolbar();
    const panel   = buildPanel();
    inputArea.insertBefore(panel, inputRow);
    inputArea.insertBefore(toolbar, inputRow);

    ctx.sendToBackend({ type: 'ri:load' });
  }

  const obs = new MutationObserver(() => { if (!document.getElementById('ri-toolbar')) mount(); });
  obs.observe(document.body, { childList: true, subtree: true });
  mount();

  return () => {
    obs.disconnect(); unsubMsg(); removeStyle();
    document.getElementById('ri-toolbar')?.remove();
    document.getElementById('ri-panel')?.remove();
    presetModal?.dismiss();
  };
}

function esc(s = '') { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
