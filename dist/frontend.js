// Response Instructions + Write For Me — Lumiverse Spindle Frontend
// Mounts via data-spindle-mount="chat_composer_above" (official Spindle slot)

(async () => {

  // ─── Constants ──────────────────────────────────────────────────────────────
  const TOOLBAR_ID  = 'ri-toolbar';
  const PANEL_ID    = 'ri-panel';
  const STORAGE_KEY = 'ri_state';

  // ─── State ──────────────────────────────────────────────────────────────────
  let state = {
    instruction: '',
    enabled: false,
    presets: {},
    wfm_direction: '',
  };

  let activeTab  = 'ri';
  let panelOpen  = false;
  let drafts     = [];
  let generating = false;

  // ─── Storage (frontend uses spindle.storage directly) ──────────────────────
  async function loadState() {
    try {
      const raw = await spindle.storage.get(STORAGE_KEY);
      if (raw) state = { ...state, ...JSON.parse(raw) };
    } catch (_) {}
  }

  async function saveState() {
    try {
      await spindle.storage.set(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // Send current instruction state to backend interceptor
  function syncBackend() {
    spindle.send('ri:update', {
      instruction: state.instruction,
      enabled:     state.enabled,
    });
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ri-styles')) return;
    const s = document.createElement('style');
    s.id = 'ri-styles';
    s.textContent = `
      /* ── toolbar row ── */
      #ri-toolbar {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 10px;
        height: 34px;
        flex-shrink: 0;
        box-sizing: border-box;
        background: var(--background-secondary, rgba(0,0,0,0.15));
        border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
        --ri-accent:    var(--primary-color, #a78bfa);
        --ri-btn-bg:    rgba(255,255,255,0.05);
        --ri-btn-hover: rgba(255,255,255,0.11);
        --ri-text:      var(--text-primary, #e2e8f0);
        --ri-muted:     rgba(255,255,255,0.38);
      }

      /* ── toolbar buttons ── */
      .ri-tb-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 9px;
        height: 22px;
        border-radius: 4px;
        border: 1px solid transparent;
        background: var(--ri-btn-bg);
        color: var(--ri-muted);
        font-size: 11.5px;
        font-family: inherit;
        cursor: pointer;
        transition: background .14s, color .14s, border-color .14s;
        white-space: nowrap;
        user-select: none;
        line-height: 1;
      }
      .ri-tb-btn:hover { background: var(--ri-btn-hover); color: var(--ri-text); }
      .ri-tb-btn.ri-active {
        border-color: var(--ri-accent);
        color: var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 12%, transparent);
      }
      .ri-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: var(--ri-muted);
        flex-shrink: 0;
        transition: background .14s;
      }
      .ri-tb-btn.ri-active .ri-dot { background: var(--ri-accent); box-shadow: 0 0 4px var(--ri-accent); }

      #ri-preset-btn { margin-left: auto; padding: 2px 7px; font-size: 12px; }

      /* ── slide-down panel ── */
      #ri-panel {
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: max-height .2s ease, opacity .15s ease;
        background: var(--background-primary, #15151f);
        border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
        flex-shrink: 0;
      }
      #ri-panel.ri-open { max-height: 360px; opacity: 1; }
      .ri-panel-inner { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }

      /* ── tabs ── */
      .ri-tabs {
        display: flex; gap: 4px;
        border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
        padding-bottom: 6px;
      }
      .ri-tab {
        background: none; border: none;
        color: var(--ri-muted); font-size: 12px; font-family: inherit;
        cursor: pointer; padding: 2px 8px; border-radius: 4px;
        transition: color .13s, background .13s;
      }
      .ri-tab:hover { color: var(--ri-text); }
      .ri-tab.ri-active { color: var(--ri-accent); background: color-mix(in srgb, var(--ri-accent) 10%, transparent); }

      /* ── shared textarea ── */
      .ri-ta {
        width: 100%; box-sizing: border-box; min-height: 68px; resize: vertical;
        background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px; color: var(--ri-text); font-size: 12.5px; font-family: inherit;
        padding: 6px 9px; outline: none; transition: border-color .14s;
      }
      .ri-ta:focus { border-color: var(--ri-accent); }

      /* ── toggle row ── */
      .ri-toggle-row {
        display: flex; align-items: center; gap: 8px;
        font-size: 11.5px; color: var(--ri-muted);
      }
      .ri-toggle { position: relative; width: 28px; height: 15px; flex-shrink: 0; cursor: pointer; }
      .ri-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
      .ri-toggle-track {
        position: absolute; inset: 0; border-radius: 8px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        transition: background .18s, border-color .18s;
      }
      .ri-toggle input:checked ~ .ri-toggle-track {
        background: color-mix(in srgb, var(--ri-accent) 28%, transparent);
        border-color: var(--ri-accent);
      }
      .ri-toggle-thumb {
        position: absolute; top: 2px; left: 2px;
        width: 9px; height: 9px; border-radius: 50%;
        background: var(--ri-muted); transition: transform .18s, background .18s;
      }
      .ri-toggle input:checked ~ .ri-toggle-thumb { transform: translateX(13px); background: var(--ri-accent); }

      /* ── WFM ── */
      .ri-wfm-row { display: flex; gap: 6px; align-items: flex-end; }
      .ri-wfm-row .ri-ta { flex: 1; min-height: 44px; }
      .ri-gen-btn {
        padding: 5px 12px; border-radius: 5px; height: 32px;
        border: 1px solid var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 14%, transparent);
        color: var(--ri-accent); font-size: 12px; font-family: inherit;
        cursor: pointer; white-space: nowrap; transition: background .13s; align-self: flex-end;
      }
      .ri-gen-btn:hover { background: color-mix(in srgb, var(--ri-accent) 26%, transparent); }
      .ri-gen-btn:disabled { opacity: .4; cursor: default; }
      .ri-status { font-size: 11px; color: var(--ri-muted); min-height: 13px; }

      /* ── draft items ── */
      .ri-draft {
        background: rgba(0,0,0,0.18);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 6px; padding: 7px 9px;
        font-size: 12.5px; color: var(--ri-text);
        white-space: pre-wrap; word-break: break-word;
      }
      .ri-draft-actions { display: flex; gap: 5px; justify-content: flex-end; margin-top: 4px; }
      .ri-draft-actions button {
        background: none; border: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px; color: var(--ri-muted); font-size: 11px;
        font-family: inherit; cursor: pointer; padding: 2px 7px;
        transition: color .13s, border-color .13s;
      }
      .ri-draft-actions button:hover { color: var(--ri-accent); border-color: var(--ri-accent); }

      /* ── preset modal ── */
      #ri-preset-modal {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        z-index: 9999; display: flex; align-items: center; justify-content: center;
      }
      #ri-preset-modal.ri-hidden { display: none; }
      .ri-modal-box {
        background: var(--background-primary, #1e1e2e);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px; padding: 16px; width: 300px; max-width: 90vw;
        display: flex; flex-direction: column; gap: 10px;
      }
      .ri-modal-box h3 { margin: 0; font-size: 13px; color: var(--ri-text); font-weight: 600; }
      .ri-preset-list { display: flex; flex-direction: column; gap: 3px; max-height: 180px; overflow-y: auto; }
      .ri-preset-entry {
        display: flex; align-items: center; gap: 6px;
        padding: 5px 8px; border-radius: 5px; cursor: pointer;
        transition: background .12s; font-size: 12.5px; color: var(--ri-text);
      }
      .ri-preset-entry:hover { background: var(--ri-btn-hover); }
      .ri-preset-entry .ri-del {
        margin-left: auto; background: none; border: none;
        color: var(--ri-muted); cursor: pointer; font-size: 11px; padding: 0 2px;
        transition: color .12s;
      }
      .ri-preset-entry .ri-del:hover { color: #f87171; }
      .ri-preset-save-row { display: flex; gap: 6px; }
      .ri-preset-save-row input {
        flex: 1; background: rgba(0,0,0,0.22);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 5px;
        color: var(--ri-text); font-size: 12px; font-family: inherit; padding: 5px 8px; outline: none;
      }
      .ri-preset-save-row input:focus { border-color: var(--ri-accent); }
      .ri-preset-save-row button {
        padding: 5px 10px; border-radius: 5px;
        border: 1px solid var(--ri-accent);
        background: color-mix(in srgb, var(--ri-accent) 14%, transparent);
        color: var(--ri-accent); font-size: 12px; font-family: inherit; cursor: pointer;
      }
      .ri-modal-close {
        align-self: flex-end; background: none; border: none;
        color: var(--ri-muted); font-size: 12px; cursor: pointer; font-family: inherit; padding: 0;
      }
      .ri-modal-close:hover { color: var(--ri-text); }
    `;
    document.head.appendChild(s);
  }

  // ─── Build toolbar ───────────────────────────────────────────────────────────
  function buildToolbar() {
    const el = document.createElement('div');
    el.id = TOOLBAR_ID;
    el.innerHTML = `
      <button class="ri-tb-btn ${state.enabled ? 'ri-active' : ''}" id="ri-btn-ri">
        <span class="ri-dot"></span> Response Instructions
      </button>
      <button class="ri-tb-btn" id="ri-btn-wfm">✦ Write For Me</button>
      <button class="ri-tb-btn" id="ri-preset-btn" title="Presets">📁</button>
    `;
    el.querySelector('#ri-btn-ri').onclick  = () => togglePanel('ri');
    el.querySelector('#ri-btn-wfm').onclick = () => togglePanel('wfm');
    el.querySelector('#ri-preset-btn').onclick = openPresetModal;
    return el;
  }

  // ─── Build slide-down panel ──────────────────────────────────────────────────
  function buildPanel() {
    const el = document.createElement('div');
    el.id = PANEL_ID;
    el.innerHTML = `
      <div class="ri-panel-inner">
        <div class="ri-tabs">
          <button class="ri-tab ri-active" data-tab="ri">📜 Instructions</button>
          <button class="ri-tab" data-tab="wfm">✦ Write For Me</button>
        </div>

        <div id="ri-tab-ri" style="display:flex; flex-direction:column; gap:8px;">
          <textarea class="ri-ta" id="ri-instr-ta" placeholder="Type your response instruction…">${escHtml(state.instruction)}</textarea>
          <div class="ri-toggle-row">
            <label class="ri-toggle">
              <input type="checkbox" id="ri-toggle" ${state.enabled ? 'checked' : ''}>
              <span class="ri-toggle-track"></span>
              <span class="ri-toggle-thumb"></span>
            </label>
            <span id="ri-toggle-lbl">${state.enabled ? 'Active' : 'Off'}</span>
            <button class="ri-tb-btn" id="ri-clear-btn" style="margin-left:auto; font-size:11px; height:20px; padding:0 7px;">🗑 Clear</button>
          </div>
        </div>

        <div id="ri-tab-wfm" style="display:none; flex-direction:column; gap:8px;">
          <div class="ri-wfm-row">
            <textarea class="ri-ta" id="ri-wfm-dir" placeholder="Direction (optional)…">${escHtml(state.wfm_direction)}</textarea>
            <button class="ri-gen-btn" id="ri-gen-btn">Generate</button>
          </div>
          <div class="ri-status" id="ri-wfm-status"></div>
          <div id="ri-drafts"></div>
        </div>
      </div>
    `;

    // Tab switching
    el.querySelectorAll('.ri-tab').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        el.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('ri-active', b === btn));
        el.querySelector('#ri-tab-ri').style.display  = activeTab === 'ri'  ? 'flex' : 'none';
        el.querySelector('#ri-tab-wfm').style.display = activeTab === 'wfm' ? 'flex' : 'none';
      };
    });

    // Instruction textarea
    const ta = el.querySelector('#ri-instr-ta');
    ta.oninput = async () => { state.instruction = ta.value; await saveState(); syncBackend(); };

    // Toggle
    const chk = el.querySelector('#ri-toggle');
    const lbl = el.querySelector('#ri-toggle-lbl');
    chk.onchange = async () => {
      state.enabled = chk.checked;
      lbl.textContent = state.enabled ? 'Active' : 'Off';
      refreshRiBtn();
      await saveState();
      syncBackend();
    };

    // Clear
    el.querySelector('#ri-clear-btn').onclick = async () => {
      state.instruction = ''; state.enabled = false;
      ta.value = ''; chk.checked = false; lbl.textContent = 'Off';
      refreshRiBtn();
      await saveState();
      syncBackend();
    };

    // WFM direction
    const wfmDir = el.querySelector('#ri-wfm-dir');
    wfmDir.oninput = () => { state.wfm_direction = wfmDir.value; };

    // Generate
    el.querySelector('#ri-gen-btn').onclick = generateDraft;

    return el;
  }

  // ─── Panel toggle ────────────────────────────────────────────────────────────
  function togglePanel(tab) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    if (panelOpen && activeTab === tab) {
      // same button → close
      panelOpen = false;
      panel.classList.remove('ri-open');
      refreshBtns();
      return;
    }

    // open / switch tab
    panelOpen = true;
    activeTab = tab;
    panel.classList.add('ri-open');

    // switch tab content
    panel.querySelector('#ri-tab-ri').style.display  = tab === 'ri'  ? 'flex' : 'none';
    panel.querySelector('#ri-tab-wfm').style.display = tab === 'wfm' ? 'flex' : 'none';
    panel.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('ri-active', b.dataset.tab === tab));

    refreshBtns();
  }

  function refreshRiBtn() {
    const btn = document.getElementById('ri-btn-ri');
    if (btn) btn.classList.toggle('ri-active', state.enabled || (panelOpen && activeTab === 'ri'));
  }
  function refreshBtns() {
    const ri  = document.getElementById('ri-btn-ri');
    const wfm = document.getElementById('ri-btn-wfm');
    if (ri)  ri.classList.toggle('ri-active',  state.enabled || (panelOpen && activeTab === 'ri'));
    if (wfm) wfm.classList.toggle('ri-active', panelOpen && activeTab === 'wfm');
  }

  // ─── Write For Me ────────────────────────────────────────────────────────────
  async function generateDraft() {
    if (generating) return;
    generating = true;
    const genBtn  = document.getElementById('ri-gen-btn');
    const status  = document.getElementById('ri-wfm-status');
    const draftEl = document.getElementById('ri-drafts');
    genBtn.disabled = true; genBtn.textContent = '…';
    if (status)  status.textContent  = 'Generating…';
    if (draftEl) draftEl.innerHTML   = '';

    try {
      const result = await spindle.generate({
        messages: [{
          role: 'user',
          content: state.wfm_direction?.trim()
            ? `Draft a message for me to send in this roleplay chat. Direction: ${state.wfm_direction.trim()}`
            : 'Draft a short message for me to send in this roleplay chat, fitting the current context.',
        }],
        max_tokens: 512,
      });

      const text = result?.text ?? result?.content ?? '';
      drafts = [text];
      if (status) status.textContent = 'Done — click Use to insert.';
      renderDrafts();
    } catch (err) {
      if (status) status.textContent = `Error: ${err?.message ?? 'generation failed'}`;
    } finally {
      generating = false;
      genBtn.disabled = false; genBtn.textContent = 'Generate';
    }
  }

  function renderDrafts() {
    const container = document.getElementById('ri-drafts');
    if (!container) return;
    container.innerHTML = '';
    drafts.forEach(text => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="ri-draft">${escHtml(text)}</div>
        <div class="ri-draft-actions">
          <button data-action="use">↩ Use</button>
          <button data-action="copy">⎘ Copy</button>
        </div>
      `;
      wrap.querySelector('[data-action="use"]').onclick  = () => insertDraft(text);
      wrap.querySelector('[data-action="copy"]').onclick = () => navigator.clipboard?.writeText(text).catch(() => {});
      container.appendChild(wrap);
    });
  }

  function insertDraft(text) {
    const ta = document.querySelector('textarea[name="chat-message"]');
    if (!ta) return;
    // React-friendly value set
    const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSet) nativeSet.call(ta, text);
    else ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    togglePanel('wfm'); // close panel
  }

  // ─── Preset modal ────────────────────────────────────────────────────────────
  function ensurePresetModal() {
    if (document.getElementById('ri-preset-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'ri-preset-modal';
    overlay.className = 'ri-hidden';
    overlay.innerHTML = `
      <div class="ri-modal-box">
        <h3>📁 Presets</h3>
        <div class="ri-preset-list" id="ri-preset-list"></div>
        <div class="ri-preset-save-row">
          <input id="ri-preset-name" type="text" placeholder="Preset name…">
          <button id="ri-preset-save">Save current</button>
        </div>
        <button class="ri-modal-close" id="ri-preset-close">✕ Close</button>
      </div>
    `;
    overlay.onclick = e => { if (e.target === overlay) closePresetModal(); };
    overlay.querySelector('#ri-preset-close').onclick = closePresetModal;
    overlay.querySelector('#ri-preset-save').onclick  = savePreset;
    document.body.appendChild(overlay);
  }

  function openPresetModal() {
    ensurePresetModal();
    document.getElementById('ri-preset-modal')?.classList.remove('ri-hidden');
    renderPresetList();
  }
  function closePresetModal() {
    document.getElementById('ri-preset-modal')?.classList.add('ri-hidden');
  }

  async function savePreset() {
    const input = document.getElementById('ri-preset-name');
    const name  = input?.value.trim();
    if (!name) return;
    state.presets[name] = state.instruction;
    input.value = '';
    await saveState();
    renderPresetList();
  }

  function renderPresetList() {
    const list = document.getElementById('ri-preset-list');
    if (!list) return;
    const names = Object.keys(state.presets);
    if (!names.length) {
      list.innerHTML = '<div style="font-size:11.5px; color:var(--ri-muted); padding:4px 8px;">No presets yet.</div>';
      return;
    }
    list.innerHTML = '';
    names.forEach(name => {
      const row = document.createElement('div');
      row.className = 'ri-preset-entry';
      row.innerHTML = `<span>${escHtml(name)}</span><button class="ri-del" title="Delete">✕</button>`;
      row.querySelector('span').onclick = () => { loadPreset(name); closePresetModal(); };
      row.querySelector('.ri-del').onclick = async e => {
        e.stopPropagation();
        delete state.presets[name];
        await saveState();
        renderPresetList();
      };
      list.appendChild(row);
    });
  }

  async function loadPreset(name) {
    state.instruction = state.presets[name] ?? '';
    const ta = document.getElementById('ri-instr-ta');
    if (ta) ta.value = state.instruction;
    await saveState();
    syncBackend();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function escHtml(s = '') {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ─── Mount ───────────────────────────────────────────────────────────────────
  // Use the official Spindle mount slot: data-spindle-mount="chat_composer_above"
  // It sits as the first child inside [data-component="InputArea"]
  // We inject toolbar + panel *before* that slot's parent (i.e. as siblings above InputArea)

  function getAnchor() {
    // The slot itself lives inside InputArea — we want to insert *above* InputArea
    // so target InputArea's parent and insert before InputArea
    return document.querySelector('[data-component="InputArea"]');
  }

  function mount() {
    if (document.getElementById(TOOLBAR_ID)) return;
    const inputArea = getAnchor();
    if (!inputArea) return;

    const parent  = inputArea.parentElement;
    if (!parent) return;

    const toolbar = buildToolbar();
    const panel   = buildPanel();

    // Insert: panel then toolbar, both immediately before InputArea
    // Result order: … chat … | panel | toolbar | InputArea
    parent.insertBefore(toolbar, inputArea);
    parent.insertBefore(panel,   toolbar);
  }

  function watchForMount() {
    // Mount now if ready, else observe
    if (getAnchor()) { mount(); return; }
    const obs = new MutationObserver(() => {
      if (getAnchor()) { obs.disconnect(); mount(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function watchForRemount() {
    // Re-mount if Lumiverse tears down and rebuilds InputArea (chat switch etc.)
    const obs = new MutationObserver(() => {
      if (!document.getElementById(TOOLBAR_ID) && getAnchor()) mount();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Init ────────────────────────────────────────────────────────────────────
  await loadState();
  injectStyles();
  watchForMount();
  watchForRemount();
  // sync backend *after* mount so spindle comm is established
  syncBackend();

})();
