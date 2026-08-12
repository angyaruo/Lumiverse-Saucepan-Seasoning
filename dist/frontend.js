// Response Instructions + Write For Me — Lumiverse Spindle Frontend
// UI: fixed toolbar row above InputArea (no float button)

(async () => {
  // ─── Constants ──────────────────────────────────────────────────────────────

  const TOOLBAR_ID   = 'ri-toolbar';
  const PANEL_ID     = 'ri-panel';
  const STORAGE_KEY  = 'ri_state';

  // ─── State ──────────────────────────────────────────────────────────────────

  let state = {
    instruction: '',
    enabled: false,
    presets: {},
    wfm_direction: '',
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function getChatColumn() {
    // The column that holds both the chat and InputArea
    return document.querySelector('[class*="_chatColumnInner_"]');
  }

  function getInputArea() {
    return document.querySelector('[data-component="InputArea"]');
  }

  // ─── Persist ────────────────────────────────────────────────────────────────

  async function loadState() {
    try {
      const saved = await spindle.storage.get(STORAGE_KEY);
      if (saved) state = { ...state, ...JSON.parse(saved) };
    } catch (_) {}
  }

  async function saveState() {
    try {
      await spindle.storage.set(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // Sync state to backend (interceptor reads from backend module)
  function syncBackend() {
    spindle.send('ri:update', {
      instruction: state.instruction,
      enabled: state.enabled,
    });
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('ri-styles')) return;
    const style = document.createElement('style');
    style.id = 'ri-styles';
    style.textContent = `
      /* ── Toolbar row ── */
      #${TOOLBAR_ID} {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        height: 36px;
        box-sizing: border-box;
        flex-shrink: 0;
        background: var(--background-secondary, rgba(0,0,0,0.18));
        border-top: 1px solid var(--border-color, rgba(255,255,255,0.07));
        border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
        z-index: 10;
        /* theming hooks */
        --ri-accent: var(--primary-color, #a78bfa);
        --ri-btn-bg: var(--button-secondary-bg, rgba(255,255,255,0.06));
        --ri-btn-hover: var(--button-secondary-hover, rgba(255,255,255,0.12));
        --ri-text: var(--text-primary, #e2e8f0);
        --ri-text-muted: var(--text-muted, rgba(255,255,255,0.4));
      }

      /* ── Toolbar buttons ── */
      .ri-tb-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 9px;
        border-radius: 5px;
        border: 1px solid transparent;
        background: var(--ri-btn-bg);
        color: var(--ri-text-muted);
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        white-space: nowrap;
        user-select: none;
        line-height: 1;
      }
      .ri-tb-btn:hover {
        background: var(--ri-btn-hover);
        color: var(--ri-text);
      }
      .ri-tb-btn.active {
        border-color: var(--ri-accent);
        color: var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 10%, transparent);
      }
      .ri-tb-btn .ri-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ri-text-muted);
        transition: background 0.15s;
        flex-shrink: 0;
      }
      .ri-tb-btn.active .ri-dot {
        background: var(--ri-accent);
        box-shadow: 0 0 4px var(--ri-accent);
      }

      /* ── Preset button ── */
      #ri-preset-btn {
        margin-left: auto;
        font-size: 13px;
        padding: 3px 7px;
      }

      /* ── Panel (slide-down from toolbar) ── */
      #${PANEL_ID} {
        position: relative;
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: max-height 0.2s ease, opacity 0.15s ease;
        background: var(--background-primary, #1a1a2e);
        border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
        z-index: 9;
        flex-shrink: 0;
      }
      #${PANEL_ID}.open {
        max-height: 400px;
        opacity: 1;
      }
      .ri-panel-inner {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* ── Tabs ── */
      .ri-tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
        padding-bottom: 6px;
      }
      .ri-tab {
        background: none;
        border: none;
        color: var(--ri-text-muted);
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        padding: 3px 8px;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
      }
      .ri-tab:hover { color: var(--ri-text); }
      .ri-tab.active {
        color: var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 10%, transparent);
      }

      /* ── Textarea shared ── */
      .ri-textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 72px;
        resize: vertical;
        background: var(--background-secondary, rgba(0,0,0,0.25));
        border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        border-radius: 6px;
        color: var(--ri-text);
        font-size: 13px;
        font-family: inherit;
        padding: 7px 9px;
        outline: none;
        transition: border-color 0.15s;
      }
      .ri-textarea:focus {
        border-color: var(--ri-accent);
      }

      /* ── Toggle row ── */
      .ri-toggle-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--ri-text-muted);
      }
      .ri-toggle {
        position: relative;
        width: 30px;
        height: 16px;
        flex-shrink: 0;
        cursor: pointer;
      }
      .ri-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
      .ri-toggle-track {
        position: absolute;
        inset: 0;
        border-radius: 8px;
        background: var(--background-secondary, rgba(255,255,255,0.1));
        border: 1px solid var(--border-color, rgba(255,255,255,0.15));
        transition: background 0.2s, border-color 0.2s;
      }
      .ri-toggle input:checked ~ .ri-toggle-track {
        background: color-mix(in srgb, var(--ri-accent) 30%, transparent);
        border-color: var(--ri-accent);
      }
      .ri-toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--ri-text-muted);
        transition: transform 0.2s, background 0.2s;
      }
      .ri-toggle input:checked ~ .ri-toggle-thumb {
        transform: translateX(14px);
        background: var(--ri-accent);
      }

      /* ── WFM controls ── */
      .ri-wfm-controls {
        display: flex;
        gap: 6px;
        align-items: flex-end;
      }
      .ri-wfm-controls .ri-textarea {
        flex: 1;
        min-height: 48px;
      }
      .ri-gen-btn {
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 15%, transparent);
        color: var(--ri-accent);
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
        align-self: flex-end;
        height: 34px;
      }
      .ri-gen-btn:hover {
        background: color-mix(in srgb, var(--ri-accent) 28%, transparent);
      }
      .ri-gen-btn:disabled {
        opacity: 0.45;
        cursor: default;
      }

      /* ── Draft browser ── */
      .ri-drafts {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .ri-draft-item {
        background: var(--background-secondary, rgba(0,0,0,0.2));
        border: 1px solid var(--border-color, rgba(255,255,255,0.07));
        border-radius: 6px;
        padding: 7px 9px;
        font-size: 13px;
        color: var(--ri-text);
        cursor: pointer;
        transition: border-color 0.15s;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .ri-draft-item:hover { border-color: var(--ri-accent); }
      .ri-draft-actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }
      .ri-draft-actions button {
        background: none;
        border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        border-radius: 4px;
        color: var(--ri-text-muted);
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        padding: 2px 8px;
        transition: color 0.15s, border-color 0.15s;
      }
      .ri-draft-actions button:hover { color: var(--ri-accent); border-color: var(--ri-accent); }

      /* ── Preset library overlay ── */
      #ri-preset-lib {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #ri-preset-lib.hidden { display: none; }
      .ri-preset-modal {
        background: var(--background-primary, #1e1e2e);
        border: 1px solid var(--border-color, rgba(255,255,255,0.12));
        border-radius: 10px;
        padding: 16px;
        width: 320px;
        max-width: 90vw;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ri-preset-modal h3 {
        margin: 0;
        font-size: 14px;
        color: var(--ri-text);
        font-weight: 600;
      }
      .ri-preset-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 200px;
        overflow-y: auto;
      }
      .ri-preset-entry {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.12s;
        font-size: 13px;
        color: var(--ri-text);
      }
      .ri-preset-entry:hover { background: var(--ri-btn-hover); }
      .ri-preset-entry .ri-del {
        margin-left: auto;
        background: none;
        border: none;
        color: var(--ri-text-muted);
        cursor: pointer;
        font-size: 12px;
        padding: 0 2px;
        transition: color 0.12s;
      }
      .ri-preset-entry .ri-del:hover { color: #f87171; }
      .ri-preset-save-row {
        display: flex;
        gap: 6px;
      }
      .ri-preset-save-row input {
        flex: 1;
        background: var(--background-secondary, rgba(0,0,0,0.25));
        border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        border-radius: 5px;
        color: var(--ri-text);
        font-size: 12px;
        font-family: inherit;
        padding: 5px 8px;
        outline: none;
      }
      .ri-preset-save-row input:focus { border-color: var(--ri-accent); }
      .ri-preset-save-row button {
        padding: 5px 10px;
        border-radius: 5px;
        border: 1px solid var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 15%, transparent);
        color: var(--ri-accent);
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
      }
      .ri-preset-close {
        align-self: flex-end;
        background: none;
        border: none;
        color: var(--ri-text-muted);
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
        padding: 0;
      }
      .ri-preset-close:hover { color: var(--ri-text); }

      /* ── Status text ── */
      .ri-status {
        font-size: 11px;
        color: var(--ri-text-muted);
        padding: 2px 0;
        min-height: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Build UI ────────────────────────────────────────────────────────────────

  let activeTab = 'ri'; // 'ri' | 'wfm'
  let panelOpen = false;
  let drafts = [];
  let generating = false;

  function buildToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = TOOLBAR_ID;

    // RI button
    toolbar.innerHTML = `
      <button class="ri-tb-btn ${state.enabled ? 'active' : ''}" id="ri-tb-ri">
        <span class="ri-dot"></span>
        Response Instructions
      </button>
      <button class="ri-tb-btn" id="ri-tb-wfm">
        ✦ Write For Me
      </button>
      <button class="ri-tb-btn" id="ri-preset-btn" title="Presets">📁</button>
    `;

    toolbar.querySelector('#ri-tb-ri').addEventListener('click', () => {
      if (!panelOpen || activeTab !== 'ri') {
        openPanel('ri');
      } else {
        closePanel();
      }
    });

    toolbar.querySelector('#ri-tb-wfm').addEventListener('click', () => {
      if (!panelOpen || activeTab !== 'wfm') {
        openPanel('wfm');
      } else {
        closePanel();
      }
    });

    toolbar.querySelector('#ri-preset-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openPresetLib();
    });

    return toolbar;
  }

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="ri-panel-inner">
        <div class="ri-tabs">
          <button class="ri-tab ${activeTab === 'ri' ? 'active' : ''}" data-tab="ri">📜 Instructions</button>
          <button class="ri-tab ${activeTab === 'wfm' ? 'active' : ''}" data-tab="wfm">✦ Write For Me</button>
        </div>

        <div id="ri-tab-ri" style="display:${activeTab === 'ri' ? 'flex' : 'none'}; flex-direction:column; gap:8px;">
          <textarea class="ri-textarea" id="ri-instruction-ta" placeholder="Type your response instruction here…">${state.instruction}</textarea>
          <div class="ri-toggle-row">
            <label class="ri-toggle">
              <input type="checkbox" id="ri-toggle-chk" ${state.enabled ? 'checked' : ''}>
              <span class="ri-toggle-track"></span>
              <span class="ri-toggle-thumb"></span>
            </label>
            <span id="ri-toggle-label">${state.enabled ? 'Active — injecting into next prompt' : 'Off'}</span>
            <button class="ri-tb-btn" id="ri-clear-btn" style="margin-left:auto; font-size:11px; padding:2px 7px;">🗑 Clear</button>
          </div>
        </div>

        <div id="ri-tab-wfm" style="display:${activeTab === 'wfm' ? 'flex' : 'none'}; flex-direction:column; gap:8px;">
          <div class="ri-wfm-controls">
            <textarea class="ri-textarea" id="ri-wfm-dir" placeholder="Optional direction (e.g. 'be more poetic', 'continue in second person'…)">${state.wfm_direction}</textarea>
            <button class="ri-gen-btn" id="ri-gen-btn">Generate</button>
          </div>
          <div class="ri-status" id="ri-wfm-status"></div>
          <div class="ri-drafts" id="ri-drafts-container"></div>
        </div>
      </div>
    `;

    // Tab switching
    panel.querySelectorAll('.ri-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // RI textarea
    const ta = panel.querySelector('#ri-instruction-ta');
    ta.addEventListener('input', async () => {
      state.instruction = ta.value;
      await saveState();
      syncBackend();
    });

    // Toggle
    const chk = panel.querySelector('#ri-toggle-chk');
    const lbl = panel.querySelector('#ri-toggle-label');
    chk.addEventListener('change', async () => {
      state.enabled = chk.checked;
      lbl.textContent = state.enabled ? 'Active — injecting into next prompt' : 'Off';
      updateRiButton();
      await saveState();
      syncBackend();
    });

    // Clear
    panel.querySelector('#ri-clear-btn').addEventListener('click', async () => {
      state.instruction = '';
      state.enabled = false;
      ta.value = '';
      chk.checked = false;
      lbl.textContent = 'Off';
      updateRiButton();
      await saveState();
      syncBackend();
    });

    // WFM direction
    const wfmDir = panel.querySelector('#ri-wfm-dir');
    wfmDir.addEventListener('input', () => {
      state.wfm_direction = wfmDir.value;
    });

    // Generate
    panel.querySelector('#ri-gen-btn').addEventListener('click', generateDraft);

    return panel;
  }

  function buildPresetLib() {
    const overlay = document.createElement('div');
    overlay.id = 'ri-preset-lib';
    overlay.className = 'hidden';
    overlay.innerHTML = `
      <div class="ri-preset-modal">
        <h3>📁 Presets</h3>
        <div class="ri-preset-list" id="ri-preset-list"></div>
        <div class="ri-preset-save-row">
          <input type="text" id="ri-preset-name-input" placeholder="Preset name…">
          <button id="ri-preset-save-btn">Save current</button>
        </div>
        <button class="ri-preset-close" id="ri-preset-close-btn">✕ Close</button>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePresetLib();
    });
    overlay.querySelector('#ri-preset-close-btn').addEventListener('click', closePresetLib);
    overlay.querySelector('#ri-preset-save-btn').addEventListener('click', savePreset);

    document.body.appendChild(overlay);
    renderPresetList();
    return overlay;
  }

  // ─── Panel open/close ────────────────────────────────────────────────────────

  function openPanel(tab) {
    activeTab = tab;
    panelOpen = true;
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    // switch tab content
    panel.querySelector('#ri-tab-ri').style.display    = tab === 'ri'  ? 'flex' : 'none';
    panel.querySelector('#ri-tab-wfm').style.display   = tab === 'wfm' ? 'flex' : 'none';
    panel.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    panel.classList.add('open');
    // mark toolbar buttons
    document.getElementById('ri-tb-ri')?.classList.toggle('active', tab === 'ri' && state.enabled ? true : tab === 'ri');
    document.getElementById('ri-tb-wfm')?.classList.toggle('active', tab === 'wfm');
  }

  function closePanel() {
    panelOpen = false;
    const panel = document.getElementById(PANEL_ID);
    panel?.classList.remove('open');
    document.getElementById('ri-tb-ri')?.classList.toggle('active', state.enabled);
    document.getElementById('ri-tb-wfm')?.classList.remove('active');
  }

  function switchTab(tab) {
    activeTab = tab;
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.querySelector('#ri-tab-ri').style.display    = tab === 'ri'  ? 'flex' : 'none';
    panel.querySelector('#ri-tab-wfm').style.display   = tab === 'wfm' ? 'flex' : 'none';
    panel.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  }

  function updateRiButton() {
    const btn = document.getElementById('ri-tb-ri');
    if (!btn) return;
    btn.classList.toggle('active', state.enabled || (panelOpen && activeTab === 'ri'));
  }

  // ─── Preset lib ──────────────────────────────────────────────────────────────

  function openPresetLib() {
    document.getElementById('ri-preset-lib')?.classList.remove('hidden');
    renderPresetList();
  }

  function closePresetLib() {
    document.getElementById('ri-preset-lib')?.classList.add('hidden');
  }

  async function savePreset() {
    const nameInput = document.getElementById('ri-preset-name-input');
    const name = nameInput?.value.trim();
    if (!name) return;
    state.presets[name] = state.instruction;
    nameInput.value = '';
    await saveState();
    renderPresetList();
  }

  function renderPresetList() {
    const list = document.getElementById('ri-preset-list');
    if (!list) return;
    list.innerHTML = '';
    const names = Object.keys(state.presets);
    if (names.length === 0) {
      list.innerHTML = '<div style="font-size:12px; color:var(--ri-text-muted); padding:4px 8px;">No presets saved yet.</div>';
      return;
    }
    names.forEach(name => {
      const entry = document.createElement('div');
      entry.className = 'ri-preset-entry';
      entry.innerHTML = `<span>${name}</span><button class="ri-del" title="Delete">✕</button>`;
      entry.querySelector('span').addEventListener('click', () => {
        loadPreset(name);
        closePresetLib();
      });
      entry.querySelector('.ri-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        delete state.presets[name];
        await saveState();
        renderPresetList();
      });
      list.appendChild(entry);
    });
  }

  async function loadPreset(name) {
    state.instruction = state.presets[name] || '';
    const ta = document.getElementById('ri-instruction-ta');
    if (ta) ta.value = state.instruction;
    await saveState();
    syncBackend();
  }

  // ─── Write For Me ────────────────────────────────────────────────────────────

  async function generateDraft() {
    if (generating) return;
    generating = true;

    const genBtn = document.getElementById('ri-gen-btn');
    const status = document.getElementById('ri-wfm-status');
    const container = document.getElementById('ri-drafts-container');

    genBtn.disabled = true;
    genBtn.textContent = '…';
    if (status) status.textContent = 'Generating draft…';
    if (container) container.innerHTML = '';

    try {
      const result = await spindle.generate({
        messages: [
          {
            role: 'user',
            content: state.wfm_direction?.trim()
              ? `Draft a message for me to send in this chat. Direction: ${state.wfm_direction.trim()}`
              : 'Draft a message for me to send in this chat based on the current context.',
          }
        ],
        max_tokens: 512,
      });

      drafts = [result?.text || result?.content || ''];
      if (status) status.textContent = 'Done — tap a draft to use it.';
      renderDrafts();
    } catch (err) {
      if (status) status.textContent = `Error: ${err?.message || 'generation failed'}`;
    } finally {
      generating = false;
      genBtn.disabled = false;
      genBtn.textContent = 'Generate';
    }
  }

  function renderDrafts() {
    const container = document.getElementById('ri-drafts-container');
    if (!container) return;
    container.innerHTML = '';
    drafts.forEach((text, i) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="ri-draft-item">${escapeHtml(text)}</div>
        <div class="ri-draft-actions">
          <button data-action="insert" data-idx="${i}">↩ Insert</button>
          <button data-action="copy" data-idx="${i}">⎘ Copy</button>
        </div>
      `;
      wrap.querySelector('[data-action="insert"]').addEventListener('click', () => insertDraft(text));
      wrap.querySelector('[data-action="copy"]').addEventListener('click', () => {
        navigator.clipboard?.writeText(text).catch(() => {});
      });
      container.appendChild(wrap);
    });
  }

  function insertDraft(text) {
    const ta = document.querySelector('textarea[name="chat-message"]');
    if (!ta) return;
    ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    closePanel();
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ─── Mount ───────────────────────────────────────────────────────────────────

  function mount() {
    if (document.getElementById(TOOLBAR_ID)) return; // already mounted

    const chatCol = getChatColumn();
    const inputArea = getInputArea();

    if (!chatCol || !inputArea) return; // not ready yet

    const toolbar = buildToolbar();
    const panel = buildPanel();

    // Insert panel first (it needs to be above the toolbar visually? no — toolbar is the trigger row)
    // Order from top to bottom in chatColumnInner: chat messages → panel → toolbar → InputArea
    chatCol.insertBefore(toolbar, inputArea);
    chatCol.insertBefore(panel, toolbar);

    buildPresetLib();
  }

  // Retry mount with MutationObserver until InputArea appears
  function waitAndMount() {
    if (getInputArea()) {
      mount();
      return;
    }
    const obs = new MutationObserver(() => {
      if (getInputArea()) {
        obs.disconnect();
        mount();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // Re-mount if Lumiverse re-renders the input area (e.g. chat switch)
  function watchForRemount() {
    const obs = new MutationObserver(() => {
      if (!document.getElementById(TOOLBAR_ID) && getInputArea()) {
        mount();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  await loadState();
  syncBackend();
  injectStyles();
  waitAndMount();
  watchForRemount();

})();
