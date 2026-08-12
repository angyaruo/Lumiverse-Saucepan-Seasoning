// Response Instructions + Write For Me — frontend
// Loaded via dynamic import() by Lumiverse. Must export setup(ctx).

export function setup(ctx) {

  // ─── State ──────────────────────────────────────────────────────────────────
  let state = { instruction: '', enabled: false, presets: {}, wfm_direction: '' };
  let activeTab = 'ri', panelOpen = false, drafts = [], generating = false;

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const removeStyle = ctx.dom.addStyle(`
    #ri-toolbar {
      display: flex; align-items: center; gap: 6px;
      padding: 0 10px; height: 34px; flex-shrink: 0; box-sizing: border-box;
      background: var(--lumiverse-fill-subtle);
      border-bottom: 1px solid var(--lumiverse-border);
    }
    .ri-tb-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 2px 9px; height: 22px; border-radius: 4px;
      border: 1px solid transparent; background: transparent;
      color: var(--lumiverse-text-dim); font-size: 11.5px; font-family: inherit;
      cursor: pointer; white-space: nowrap; user-select: none; line-height: 1;
      transition: background 0.14s, color 0.14s, border-color 0.14s;
    }
    .ri-tb-btn:hover { background: var(--lumiverse-fill); color: var(--lumiverse-text); }
    .ri-tb-btn.ri-on {
      border-color: var(--lumiverse-accent); color: var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 12%, transparent);
    }
    .ri-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--lumiverse-text-dim); flex-shrink: 0; transition: background 0.14s;
    }
    .ri-tb-btn.ri-on .ri-dot { background: var(--lumiverse-accent); box-shadow: 0 0 4px var(--lumiverse-accent); }
    #ri-preset-btn { margin-left: auto; }
    #ri-panel {
      overflow: hidden; max-height: 0; opacity: 0;
      transition: max-height 0.2s ease, opacity 0.15s ease;
      background: var(--lumiverse-fill); border-bottom: 1px solid var(--lumiverse-border); flex-shrink: 0;
    }
    #ri-panel.ri-open { max-height: 360px; opacity: 1; }
    .ri-panel-inner { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
    .ri-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--lumiverse-border); padding-bottom: 6px; }
    .ri-tab {
      background: none; border: none; color: var(--lumiverse-text-dim);
      font-size: 12px; font-family: inherit; cursor: pointer; padding: 2px 8px; border-radius: 4px;
      transition: color 0.13s, background 0.13s;
    }
    .ri-tab:hover { color: var(--lumiverse-text); }
    .ri-tab.ri-on { color: var(--lumiverse-accent); background: color-mix(in srgb, var(--lumiverse-accent) 10%, transparent); }
    .ri-ta {
      width: 100%; box-sizing: border-box; min-height: 68px; resize: vertical;
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); color: var(--lumiverse-text);
      font-size: 12.5px; font-family: inherit; padding: 6px 9px; outline: none;
      transition: border-color 0.14s;
    }
    .ri-ta:focus { border-color: var(--lumiverse-accent); }
    .ri-toggle-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--lumiverse-text-muted); }
    .ri-toggle { position: relative; width: 28px; height: 15px; flex-shrink: 0; cursor: pointer; }
    .ri-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .ri-toggle-track {
      position: absolute; inset: 0; border-radius: 8px;
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      transition: background 0.18s, border-color 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-track {
      background: color-mix(in srgb, var(--lumiverse-accent) 28%, transparent);
      border-color: var(--lumiverse-accent);
    }
    .ri-toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 9px; height: 9px; border-radius: 50%;
      background: var(--lumiverse-text-dim); transition: transform 0.18s, background 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-thumb { transform: translateX(13px); background: var(--lumiverse-accent); }
    .ri-wfm-row { display: flex; gap: 6px; align-items: flex-end; }
    .ri-wfm-row .ri-ta { flex: 1; min-height: 44px; }
    .ri-gen-btn {
      padding: 5px 12px; border-radius: var(--lumiverse-radius); height: 32px;
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent); font-size: 12px; font-family: inherit; cursor: pointer;
      white-space: nowrap; transition: background 0.13s; align-self: flex-end;
    }
    .ri-gen-btn:hover { background: color-mix(in srgb, var(--lumiverse-accent) 26%, transparent); }
    .ri-gen-btn:disabled { opacity: .4; cursor: default; }
    .ri-status { font-size: 11px; color: var(--lumiverse-text-dim); min-height: 13px; }
    .ri-draft {
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); padding: 7px 9px;
      font-size: 12.5px; color: var(--lumiverse-text); white-space: pre-wrap; word-break: break-word;
    }
    .ri-draft-actions { display: flex; gap: 5px; justify-content: flex-end; margin-top: 4px; }
    .ri-draft-actions button {
      background: none; border: 1px solid var(--lumiverse-border); border-radius: 4px;
      color: var(--lumiverse-text-muted); font-size: 11px; font-family: inherit;
      cursor: pointer; padding: 2px 7px; transition: color 0.13s, border-color 0.13s;
    }
    .ri-draft-actions button:hover { color: var(--lumiverse-accent); border-color: var(--lumiverse-accent); }
    .ri-empty { font-size: 11.5px; color: var(--lumiverse-text-dim); padding: 4px 8px; }
  `);

  // ─── Build toolbar ────────────────────────────────────────────────────────────
  function buildToolbar() {
    const el = document.createElement('div');
    el.id = 'ri-toolbar';
    el.innerHTML = `
      <button class="ri-tb-btn" id="ri-btn-ri"><span class="ri-dot"></span> Response Instructions</button>
      <button class="ri-tb-btn" id="ri-btn-wfm">✦ Write For Me</button>
      <button class="ri-tb-btn" id="ri-preset-btn" title="Presets">📁</button>
    `;
    el.querySelector('#ri-btn-ri').onclick  = () => togglePanel('ri');
    el.querySelector('#ri-btn-wfm').onclick = () => togglePanel('wfm');
    el.querySelector('#ri-preset-btn').onclick = openPresets;
    return el;
  }

  // ─── Build panel ─────────────────────────────────────────────────────────────
  function buildPanel() {
    const el = document.createElement('div');
    el.id = 'ri-panel';
    el.innerHTML = `
      <div class="ri-panel-inner">
        <div class="ri-tabs">
          <button class="ri-tab ri-on" data-tab="ri">📜 Instructions</button>
          <button class="ri-tab" data-tab="wfm">✦ Write For Me</button>
        </div>
        <div id="ri-tab-ri" style="display:flex;flex-direction:column;gap:8px;">
          <textarea class="ri-ta" id="ri-ta" placeholder="Type your response instruction…"></textarea>
          <div class="ri-toggle-row">
            <label class="ri-toggle">
              <input type="checkbox" id="ri-chk">
              <span class="ri-toggle-track"></span>
              <span class="ri-toggle-thumb"></span>
            </label>
            <span id="ri-lbl">Off</span>
            <button class="ri-tb-btn" id="ri-clear" style="margin-left:auto;font-size:11px;height:20px;padding:0 7px;">🗑 Clear</button>
          </div>
        </div>
        <div id="ri-tab-wfm" style="display:none;flex-direction:column;gap:8px;">
          <div class="ri-wfm-row">
            <textarea class="ri-ta" id="ri-dir" placeholder="Direction (optional)…"></textarea>
            <button class="ri-gen-btn" id="ri-gen">Generate</button>
          </div>
          <div class="ri-status" id="ri-status"></div>
          <div id="ri-drafts"></div>
        </div>
      </div>
    `;

    el.querySelectorAll('.ri-tab').forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });

    const ta  = el.querySelector('#ri-ta');
    const chk = el.querySelector('#ri-chk');
    const lbl = el.querySelector('#ri-lbl');

    ta.oninput = () => { state.instruction = ta.value; push(); };
    chk.onchange = () => {
      state.enabled = chk.checked;
      lbl.textContent = state.enabled ? 'Active' : 'Off';
      refreshRiBtn(); push();
    };
    el.querySelector('#ri-clear').onclick = () => {
      state.instruction = ''; state.enabled = false;
      ta.value = ''; chk.checked = false; lbl.textContent = 'Off';
      refreshRiBtn(); push();
    };
    el.querySelector('#ri-dir').oninput = (e) => { state.wfm_direction = e.target.value; };
    el.querySelector('#ri-gen').onclick = generate;

    return el;
  }

  function applyStateToUI() {
    const ta  = document.getElementById('ri-ta');
    const chk = document.getElementById('ri-chk');
    const lbl = document.getElementById('ri-lbl');
    const dir = document.getElementById('ri-dir');
    if (ta)  ta.value       = state.instruction;
    if (chk) chk.checked    = state.enabled;
    if (lbl) lbl.textContent = state.enabled ? 'Active' : 'Off';
    if (dir) dir.value      = state.wfm_direction;
    refreshRiBtn();
  }

  // ─── Panel logic ─────────────────────────────────────────────────────────────
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
      switchTab(tab);
    }
    refreshBtns();
  }

  function switchTab(tab) {
    activeTab = tab;
    const panel = document.getElementById('ri-panel');
    if (!panel) return;
    panel.querySelector('#ri-tab-ri').style.display  = tab === 'ri'  ? 'flex' : 'none';
    panel.querySelector('#ri-tab-wfm').style.display = tab === 'wfm' ? 'flex' : 'none';
    panel.querySelectorAll('.ri-tab').forEach(b => b.classList.toggle('ri-on', b.dataset.tab === tab));
    refreshBtns();
  }

  function refreshRiBtn() {
    document.getElementById('ri-btn-ri')?.classList.toggle('ri-on', state.enabled || (panelOpen && activeTab === 'ri'));
  }
  function refreshBtns() {
    document.getElementById('ri-btn-ri')?.classList.toggle('ri-on', state.enabled || (panelOpen && activeTab === 'ri'));
    document.getElementById('ri-btn-wfm')?.classList.toggle('ri-on', panelOpen && activeTab === 'wfm');
  }

  // ─── Backend comms ────────────────────────────────────────────────────────────
  function push() {
    ctx.sendToBackend({ type: 'ri:update', ...state });
  }

  const unsubMsg = ctx.onBackendMessage((payload) => {
    if (payload.type === 'ri:state') {
      state = { ...state, ...payload.state };
      applyStateToUI();
      // re-arm interceptor with loaded state
      ctx.sendToBackend({ type: 'ri:update', ...state });
    }
    if (payload.type === 'ri:draft') {
      generating = false;
      const genBtn = document.getElementById('ri-gen');
      const status = document.getElementById('ri-status');
      if (genBtn) { genBtn.disabled = false; genBtn.textContent = 'Generate'; }
      if (payload.error) { if (status) status.textContent = `Error: ${payload.error}`; return; }
      drafts = [payload.text];
      if (status) status.textContent = 'Done — click Use to insert.';
      renderDrafts();
    }
  });

  // ─── WFM ─────────────────────────────────────────────────────────────────────
  async function generate() {
    if (generating) return;
    generating = true;
    const genBtn = document.getElementById('ri-gen');
    const status = document.getElementById('ri-status');
    const draftsEl = document.getElementById('ri-drafts');
    if (genBtn) { genBtn.disabled = true; genBtn.textContent = '…'; }
    if (status) status.textContent = 'Generating…';
    if (draftsEl) draftsEl.innerHTML = '';
    ctx.sendToBackend({ type: 'ri:generate', direction: state.wfm_direction?.trim() || '' });
  }

  function renderDrafts() {
    const container = document.getElementById('ri-drafts');
    if (!container) return;
    container.innerHTML = '';
    drafts.forEach(text => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="ri-draft">${esc(text)}</div>
        <div class="ri-draft-actions">
          <button data-use>↩ Use</button>
          <button data-copy>⎘ Copy</button>
        </div>
      `;
      wrap.querySelector('[data-use]').onclick  = () => insertDraft(text);
      wrap.querySelector('[data-copy]').onclick = () => navigator.clipboard?.writeText(text).catch(() => {});
      container.appendChild(wrap);
    });
  }

  function insertDraft(text) {
    const ta = document.querySelector('textarea[name="chat-message"]');
    if (!ta) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(ta, text); else ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    togglePanel('wfm');
  }

  // ─── Presets (native modal) ────────────────────────────────────────────────
  let presetModal = null;

  function openPresets() {
    presetModal = ctx.ui.showModal({ title: '📁 Presets', width: 320 });
    renderPresetContent();
    presetModal.onDismiss(() => { presetModal = null; });
  }

  function renderPresetContent() {
    if (!presetModal) return;
    const root = presetModal.root;
    root.innerHTML = '';
    root.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:4px 0;';

    const names = Object.keys(state.presets);
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:3px;max-height:200px;overflow-y:auto;';

    if (!names.length) {
      list.innerHTML = '<div class="ri-empty">No presets yet.</div>';
    } else {
      names.forEach(name => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:4px;cursor:pointer;font-size:12.5px;color:var(--lumiverse-text);';
        row.innerHTML = `<span style="flex:1;">${esc(name)}</span><button style="background:none;border:none;color:var(--lumiverse-text-dim);cursor:pointer;font-size:11px;padding:0 2px;" title="Delete">✕</button>`;
        row.querySelector('span').onclick = () => { loadPreset(name); presetModal?.dismiss(); };
        row.querySelector('button').onclick = (e) => {
          e.stopPropagation();
          delete state.presets[name];
          push();
          renderPresetContent();
        };
        list.appendChild(row);
      });
    }
    root.appendChild(list);

    const saveRow = document.createElement('div');
    saveRow.style.cssText = 'display:flex;gap:6px;';
    saveRow.innerHTML = `
      <input type="text" placeholder="Preset name…" style="flex:1;background:var(--lumiverse-fill-subtle);border:1px solid var(--lumiverse-border);border-radius:var(--lumiverse-radius);color:var(--lumiverse-text);font-size:12px;font-family:inherit;padding:5px 8px;outline:none;">
      <button style="padding:5px 10px;border-radius:var(--lumiverse-radius);border:1px solid var(--lumiverse-accent);background:color-mix(in srgb,var(--lumiverse-accent) 14%,transparent);color:var(--lumiverse-accent);font-size:12px;font-family:inherit;cursor:pointer;">Save</button>
    `;
    saveRow.querySelector('button').onclick = () => {
      const input = saveRow.querySelector('input');
      const name  = input.value.trim();
      if (!name) return;
      state.presets[name] = state.instruction;
      input.value = '';
      push();
      renderPresetContent();
    };
    root.appendChild(saveRow);
  }

  function loadPreset(name) {
    state.instruction = state.presets[name] ?? '';
    const ta = document.getElementById('ri-ta');
    if (ta) ta.value = state.instruction;
    push();
  }

  // ─── Mount ────────────────────────────────────────────────────────────────────
  function mount() {
    if (document.getElementById('ri-toolbar')) return;
    const inputArea = document.querySelector('[data-component="InputArea"]');
    if (!inputArea) return;
    const parent = inputArea.parentElement;
    if (!parent) return;

    const toolbar = buildToolbar();
    const panel   = buildPanel();
    parent.insertBefore(toolbar, inputArea);
    parent.insertBefore(panel, toolbar);

    ctx.sendToBackend({ type: 'ri:load' });
  }

  // Wait for InputArea, then mount; re-mount on chat switches
  const obs = new MutationObserver(() => {
    if (!document.getElementById('ri-toolbar')) mount();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  mount();

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  return () => {
    obs.disconnect();
    unsubMsg();
    removeStyle();
    document.getElementById('ri-toolbar')?.remove();
    document.getElementById('ri-panel')?.remove();
    presetModal?.dismiss();
  };
}

function esc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
