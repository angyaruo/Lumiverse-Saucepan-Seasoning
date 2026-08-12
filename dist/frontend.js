// Response Instructions + Write For Me — Lumiverse Spindle Frontend
// Must export setup(ctx). ctx is the SpindleFrontendContext — no spindle global here.

export function setup(ctx) {

  // ─── State (in-memory; persisted to backend via sendToBackend) ──────────────
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
  let stateReady = false;

  // ─── Styles — using official Lumiverse CSS variables ─────────────────────────
  const removeStyle = ctx.dom.addStyle(`
    #ri-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px;
      height: 34px;
      flex-shrink: 0;
      box-sizing: border-box;
      background: var(--lumiverse-fill-subtle);
      border-bottom: 1px solid var(--lumiverse-border);
    }
    .ri-tb-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 9px;
      height: 22px;
      border-radius: 4px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--lumiverse-text-dim);
      font-size: 11.5px;
      font-family: inherit;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast), color var(--lumiverse-transition-fast), border-color var(--lumiverse-transition-fast);
      white-space: nowrap;
      user-select: none;
      line-height: 1;
    }
    .ri-tb-btn:hover { background: var(--lumiverse-fill); color: var(--lumiverse-text); }
    .ri-tb-btn.ri-on {
      border-color: var(--lumiverse-accent);
      color: var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 12%, transparent);
    }
    .ri-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--lumiverse-text-dim);
      flex-shrink: 0;
      transition: background var(--lumiverse-transition-fast);
    }
    .ri-tb-btn.ri-on .ri-dot {
      background: var(--lumiverse-accent);
      box-shadow: 0 0 4px var(--lumiverse-accent);
    }
    #ri-preset-btn { margin-left: auto; padding: 2px 7px; font-size: 12px; }

    #ri-panel {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: max-height 0.2s ease, opacity 0.15s ease;
      background: var(--lumiverse-fill);
      border-bottom: 1px solid var(--lumiverse-border);
      flex-shrink: 0;
    }
    #ri-panel.ri-open { max-height: 360px; opacity: 1; }
    .ri-panel-inner { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }

    .ri-tabs {
      display: flex; gap: 4px;
      border-bottom: 1px solid var(--lumiverse-border);
      padding-bottom: 6px;
    }
    .ri-tab {
      background: none; border: none;
      color: var(--lumiverse-text-dim); font-size: 12px; font-family: inherit;
      cursor: pointer; padding: 2px 8px; border-radius: 4px;
      transition: color var(--lumiverse-transition-fast), background var(--lumiverse-transition-fast);
    }
    .ri-tab:hover { color: var(--lumiverse-text); }
    .ri-tab.ri-on {
      color: var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 10%, transparent);
    }

    .ri-ta {
      width: 100%; box-sizing: border-box; min-height: 68px; resize: vertical;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      color: var(--lumiverse-text); font-size: 12.5px; font-family: inherit;
      padding: 6px 9px; outline: none;
      transition: border-color var(--lumiverse-transition-fast);
    }
    .ri-ta:focus { border-color: var(--lumiverse-accent); }

    .ri-toggle-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 11.5px; color: var(--lumiverse-text-muted);
    }
    .ri-toggle { position: relative; width: 28px; height: 15px; flex-shrink: 0; cursor: pointer; }
    .ri-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .ri-toggle-track {
      position: absolute; inset: 0; border-radius: 8px;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      transition: background 0.18s, border-color 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-track {
      background: color-mix(in srgb, var(--lumiverse-accent) 28%, transparent);
      border-color: var(--lumiverse-accent);
    }
    .ri-toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 9px; height: 9px; border-radius: 50%;
      background: var(--lumiverse-text-dim);
      transition: transform 0.18s, background 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-thumb {
      transform: translateX(13px);
      background: var(--lumiverse-accent);
    }

    .ri-wfm-row { display: flex; gap: 6px; align-items: flex-end; }
    .ri-wfm-row .ri-ta { flex: 1; min-height: 44px; }
    .ri-gen-btn {
      padding: 5px 12px; border-radius: var(--lumiverse-radius); height: 32px;
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent); font-size: 12px; font-family: inherit;
      cursor: pointer; white-space: nowrap;
      transition: background var(--lumiverse-transition-fast);
      align-self: flex-end;
    }
    .ri-gen-btn:hover { background: color-mix(in srgb, var(--lumiverse-accent) 26%, transparent); }
    .ri-gen-btn:disabled { opacity: .4; cursor: default; }
    .ri-status { font-size: 11px; color: var(--lumiverse-text-dim); min-height: 13px; }

    .ri-draft {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); padding: 7px 9px;
      font-size: 12.5px; color: var(--lumiverse-text);
      white-space: pre-wrap; word-break: break-word;
    }
    .ri-draft-actions { display: flex; gap: 5px; justify-content: flex-end; margin-top: 4px; }
    .ri-draft-actions button {
      background: none; border: 1px solid var(--lumiverse-border);
      border-radius: 4px; color: var(--lumiverse-text-muted); font-size: 11px;
      font-family: inherit; cursor: pointer; padding: 2px 7px;
      transition: color var(--lumiverse-transition-fast), border-color var(--lumiverse-transition-fast);
    }
    .ri-draft-actions button:hover { color: var(--lumiverse-accent); border-color: var(--lumiverse-accent); }

    #ri-preset-modal {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
    }
    #ri-preset-modal.ri-hidden { display: none; }
    .ri-modal-box {
      background: var(--lumiverse-fill);
      border: 1px solid var(--lumiverse-border-hover);
      border-radius: calc(var(--lumiverse-radius) * 2);
      padding: 16px; width: 300px; max-width: 90vw;
      display: flex; flex-direction: column; gap: 10px;
    }
    .ri-modal-box h3 { margin: 0; font-size: 13px; color: var(--lumiverse-text); font-weight: 600; }
    .ri-preset-list { display: flex; flex-direction: column; gap: 3px; max-height: 180px; overflow-y: auto; }
    .ri-preset-entry {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 8px; border-radius: var(--lumiverse-radius); cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
      font-size: 12.5px; color: var(--lumiverse-text);
    }
    .ri-preset-entry:hover { background: var(--lumiverse-fill-subtle); }
    .ri-preset-entry .ri-del {
      margin-left: auto; background: none; border: none;
      color: var(--lumiverse-text-dim); cursor: pointer; font-size: 11px; padding: 0 2px;
    }
    .ri-preset-entry .ri-del:hover { color: #f87171; }
    .ri-preset-save-row { display: flex; gap: 6px; }
    .ri-preset-save-row input {
      flex: 1; background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius);
      color: var(--lumiverse-text); font-size: 12px; font-family: inherit;
      padding: 5px 8px; outline: none;
    }
    .ri-preset-save-row input:focus { border-color: var(--lumiverse-accent); }
    .ri-preset-save-row button {
      padding: 5px 10px; border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent); font-size: 12px; font-family: inherit; cursor: pointer;
    }
    .ri-modal-close {
      align-self: flex-end; background: none; border: none;
      color: var(--lumiverse-text-dim); font-size: 12px; cursor: pointer;
      font-family: inherit; padding: 0;
    }
    .ri-modal-close:hover { color: var(--lumiverse-text); }
  `);

  // ─── Build elements ──────────────────────────────────────────────────────────

  function buildToolbar() {
    const el = ctx.dom.createElement('div');
    el.id = 'ri-toolbar';
    el.innerHTML = `
      <button class="ri-tb-btn ${state.enabled ? 'ri-on' : ''}" id="ri-btn-ri">
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

  function buildPanel() {
    const el = ctx.dom.createElement('div');
    el.id = 'ri-panel';
    el.innerHTML = `
      <div class="ri-panel-inner">
        <div class="ri-tabs">
          <button class="ri-tab ri-on" data-tab="ri">📜 Instructions</button>
          <button class="ri-tab" data-tab="wfm">✦ Write For Me</button>
        </div>
        <div id="ri-tab-ri" style="display:flex;flex-direction:column;gap:8px;">
          <textarea class="ri-ta" id="ri-instr-ta" placeholder="Type your response instruction…"></textarea>
          <div class="ri-toggle-row">
            <label class="ri-toggle">
              <input type="checkbox" id="ri-toggle">
              <span class="ri-toggle-track"></span>
              <span class="ri-toggle-thumb"></span>
            </label>
            <span id="ri-toggle-lbl">Off</span>
            <button class="ri-tb-btn" id="ri-clear-btn" style="margin-left:auto;font-size:11px;height:20px;padding:0 7px;">🗑 Clear</button>
          </div>
        </div>
        <div id="ri-tab-wfm" style="display:none;flex-direction:column;gap:8px;">
          <div class="ri-wfm-row">
            <textarea class="ri-ta" id="ri-wfm-dir" placeholder="Direction (optional)…"></textarea>
            <button class="ri-gen-btn" id="ri-gen-btn">Generate</button>
          </div>
          <div class="ri-status" id="ri-wfm-status"></div>
          <div id="ri-drafts"></div>
        </div>
      </div>
    `;

    el.querySelectorAll('.ri-tab').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        el.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('ri-on', b === btn));
        el.querySelector('#ri-tab-ri').style.display  = activeTab === 'ri'  ? 'flex' : 'none';
        el.querySelector('#ri-tab-wfm').style.display = activeTab === 'wfm' ? 'flex' : 'none';
      };
    });

    const ta = el.querySelector('#ri-instr-ta');
    ta.oninput = () => { state.instruction = ta.value; syncBackend(); };

    const chk = el.querySelector('#ri-toggle');
    const lbl = el.querySelector('#ri-toggle-lbl');
    chk.onchange = () => {
      state.enabled = chk.checked;
      lbl.textContent = state.enabled ? 'Active' : 'Off';
      refreshRiBtn();
      syncBackend();
    };

    el.querySelector('#ri-clear-btn').onclick = () => {
      state.instruction = ''; state.enabled = false;
      ta.value = ''; chk.checked = false; lbl.textContent = 'Off';
      refreshRiBtn();
      syncBackend();
    };

    el.querySelector('#ri-wfm-dir').oninput = (e) => { state.wfm_direction = e.target.value; };
    el.querySelector('#ri-gen-btn').onclick = generateDraft;

    return el;
  }

  // ─── Apply state to panel UI once state is loaded ────────────────────────────
  function applyStateToPanel() {
    const ta  = document.getElementById('ri-instr-ta');
    const chk = document.getElementById('ri-toggle');
    const lbl = document.getElementById('ri-toggle-lbl');
    const wfm = document.getElementById('ri-wfm-dir');
    if (ta)  ta.value      = state.instruction;
    if (chk) chk.checked   = state.enabled;
    if (lbl) lbl.textContent = state.enabled ? 'Active' : 'Off';
    if (wfm) wfm.value     = state.wfm_direction;
    refreshRiBtn();
  }

  // ─── Panel toggle ────────────────────────────────────────────────────────────
  function togglePanel(tab) {
    const panel = document.getElementById('ri-panel');
    if (!panel) return;
    if (panelOpen && activeTab === tab) {
      panelOpen = false;
      panel.classList.remove('ri-open');
    } else {
      panelOpen = true;
      activeTab = tab;
      panel.classList.add('ri-open');
      panel.querySelector('#ri-tab-ri').style.display  = tab === 'ri'  ? 'flex' : 'none';
      panel.querySelector('#ri-tab-wfm').style.display = tab === 'wfm' ? 'flex' : 'none';
      panel.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('ri-on', b.dataset.tab === tab));
    }
    refreshBtns();
  }

  function refreshRiBtn() {
    const btn = document.getElementById('ri-btn-ri');
    if (btn) btn.classList.toggle('ri-on', state.enabled || (panelOpen && activeTab === 'ri'));
  }
  function refreshBtns() {
    const ri  = document.getElementById('ri-btn-ri');
    const wfm = document.getElementById('ri-btn-wfm');
    if (ri)  ri.classList.toggle('ri-on',  state.enabled || (panelOpen && activeTab === 'ri'));
    if (wfm) wfm.classList.toggle('ri-on', panelOpen && activeTab === 'wfm');
  }

  // ─── Backend comms ───────────────────────────────────────────────────────────
  function syncBackend() {
    ctx.sendToBackend({ type: 'ri:update', instruction: state.instruction, enabled: state.enabled });
  }

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === 'ri:state') {
      // Backend sends back saved state on init
      state = { ...state, ...payload.state };
      stateReady = true;
      applyStateToPanel();
      syncBackend(); // re-arm interceptor with loaded state
    }
  });

  // ─── Write For Me ────────────────────────────────────────────────────────────
  async function generateDraft() {
    if (generating) return;
    generating = true;
    const genBtn  = document.getElementById('ri-gen-btn');
    const status  = document.getElementById('ri-wfm-status');
    const draftEl = document.getElementById('ri-drafts');
    genBtn.disabled = true; genBtn.textContent = '…';
    if (status)  status.textContent = 'Generating…';
    if (draftEl) draftEl.innerHTML  = '';

    // Ask backend to generate via spindle.generate
    ctx.sendToBackend({
      type: 'ri:generate',
      direction: state.wfm_direction?.trim() || '',
    });
  }

  // Listen for generation result
  ctx.onBackendMessage((payload) => {
    if (payload.type === 'ri:draft') {
      generating = false;
      const genBtn = document.getElementById('ri-gen-btn');
      const status = document.getElementById('ri-wfm-status');
      if (genBtn) { genBtn.disabled = false; genBtn.textContent = 'Generate'; }
      if (payload.error) {
        if (status) status.textContent = `Error: ${payload.error}`;
        return;
      }
      drafts = [payload.text];
      if (status) status.textContent = 'Done — click Use to insert.';
      renderDrafts();
    }
  });

  function renderDrafts() {
    const container = document.getElementById('ri-drafts');
    if (!container) return;
    container.innerHTML = '';
    drafts.forEach(text => {
      const wrap = ctx.dom.createElement('div');
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
    const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSet) nativeSet.call(ta, text); else ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    togglePanel('wfm');
  }

  // ─── Preset modal (native ctx.ui.showModal) ───────────────────────────────────
  let presetModal = null;

  function openPresetModal() {
    presetModal = ctx.ui.showModal({ title: '📁 Presets', width: 320 });
    renderPresetModalContent();
    presetModal.onDismiss(() => { presetModal = null; });
  }

  function renderPresetModalContent() {
    if (!presetModal) return;
    const root = presetModal.root;
    root.innerHTML = '';

    const names = Object.keys(state.presets);
    const list = ctx.dom.createElement('div');
    list.className = 'ri-preset-list';
    if (!names.length) {
      list.innerHTML = '<div style="font-size:11.5px;color:var(--lumiverse-text-dim);padding:4px 8px;">No presets yet.</div>';
    } else {
      names.forEach(name => {
        const row = ctx.dom.createElement('div');
        row.className = 'ri-preset-entry';
        row.innerHTML = `<span>${escHtml(name)}</span><button class="ri-del" title="Delete">✕</button>`;
        row.querySelector('span').onclick = () => { loadPreset(name); presetModal?.dismiss(); };
        row.querySelector('.ri-del').onclick = (e) => {
          e.stopPropagation();
          delete state.presets[name];
          syncBackend();
          renderPresetModalContent();
        };
        list.appendChild(row);
      });
    }
    root.appendChild(list);

    const saveRow = ctx.dom.createElement('div');
    saveRow.className = 'ri-preset-save-row';
    saveRow.style.marginTop = '10px';
    saveRow.innerHTML = `<input type="text" placeholder="Preset name…"><button>Save current</button>`;
    saveRow.querySelector('button').onclick = () => {
      const input = saveRow.querySelector('input');
      const name  = input.value.trim();
      if (!name) return;
      state.presets[name] = state.instruction;
      input.value = '';
      syncBackend();
      renderPresetModalContent();
    };
    root.appendChild(saveRow);
  }

  function loadPreset(name) {
    state.instruction = state.presets[name] ?? '';
    const ta = document.getElementById('ri-instr-ta');
    if (ta) ta.value = state.instruction;
    syncBackend();
  }

  // ─── Mount ───────────────────────────────────────────────────────────────────
  function mount() {
    if (document.getElementById('ri-toolbar')) return;
    const inputArea = document.querySelector('[data-component="InputArea"]');
    if (!inputArea) return;
    const parent = inputArea.parentElement;
    if (!parent) return;

    const toolbar = buildToolbar();
    const panel   = buildPanel();

    // panel above toolbar, both above InputArea
    parent.insertBefore(toolbar, inputArea);
    parent.insertBefore(panel, toolbar);

    // request saved state from backend
    ctx.sendToBackend({ type: 'ri:load' });
  }

  function watchForMount() {
    if (document.querySelector('[data-component="InputArea"]')) { mount(); return; }
    const obs = new MutationObserver(() => {
      if (document.querySelector('[data-component="InputArea"]')) { obs.disconnect(); mount(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function watchForRemount() {
    const obs = new MutationObserver(() => {
      if (!document.getElementById('ri-toolbar') && document.querySelector('[data-component="InputArea"]')) {
        mount();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  watchForMount();
  watchForRemount();

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  return () => {
    removeStyle();
    unsubBackend();
    document.getElementById('ri-toolbar')?.remove();
    document.getElementById('ri-panel')?.remove();
    presetModal?.dismiss();
  };
}

function escHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
