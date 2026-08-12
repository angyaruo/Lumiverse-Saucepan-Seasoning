// Response Instructions + Write For Me — frontend

export function setup(ctx) {

  let state = { instruction: '', enabled: false, presets: {}, wfm_direction: '' };
  let activeTab = 'ri', panelOpen = false, drafts = [], draftIdx = 0, generating = false;

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const removeStyle = ctx.dom.addStyle(`
    /* ── toolbar ── */
    #ri-toolbar {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 8px; flex-shrink: 0; box-sizing: border-box;
      border-top: 1px solid var(--lumiverse-border);
    }
    .ri-icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 5px;
      border: 1px solid transparent; background: transparent;
      color: var(--lumiverse-text-dim); font-size: 14px;
      cursor: pointer; flex-shrink: 0; position: relative;
      transition: background 0.13s, color 0.13s, border-color 0.13s;
    }
    .ri-icon-btn:hover { background: var(--lumiverse-fill); color: var(--lumiverse-text); }
    .ri-icon-btn.ri-on {
      border-color: var(--lumiverse-accent); color: var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 12%, transparent);
    }
    /* enabled dot on RI button */
    .ri-icon-btn .ri-dot {
      position: absolute; top: 4px; right: 4px;
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--lumiverse-accent);
      box-shadow: 0 0 4px var(--lumiverse-accent);
      display: none;
    }
    .ri-icon-btn.ri-enabled .ri-dot { display: block; }
    #ri-divider {
      width: 1px; height: 16px; background: var(--lumiverse-border);
      margin: 0 2px; flex-shrink: 0;
    }

    /* ── slide-up panel ── */
    #ri-panel {
      overflow: hidden; max-height: 0; opacity: 0;
      transition: max-height 0.22s ease, opacity 0.16s ease;
      background: var(--lumiverse-fill);
      border-top: 1px solid var(--lumiverse-border);
      flex-shrink: 0;
    }
    #ri-panel.ri-open { max-height: 400px; opacity: 1; }

    /* ── panel header ── */
    .ri-header {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 10px 5px;
      border-bottom: 1px solid var(--lumiverse-border);
      font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
      text-transform: uppercase; color: var(--lumiverse-text-muted);
    }
    .ri-header-icon { font-size: 13px; }
    .ri-header-title { flex: 1; }
    .ri-header-btn {
      background: none; border: none; color: var(--lumiverse-text-dim);
      cursor: pointer; font-size: 13px; padding: 2px 4px; border-radius: 3px;
      transition: color 0.12s, background 0.12s; line-height: 1;
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px;
    }
    .ri-header-btn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
    .ri-header-btn.ri-on { color: var(--lumiverse-accent); }
    /* toggle pill in header */
    .ri-toggle {
      position: relative; width: 28px; height: 15px; flex-shrink: 0; cursor: pointer;
    }
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
      border-radius: 50%; background: var(--lumiverse-text-dim);
      transition: transform 0.18s, background 0.18s;
    }
    .ri-toggle input:checked ~ .ri-toggle-thumb {
      transform: translateX(13px); background: var(--lumiverse-accent);
    }

    /* ── panel body ── */
    .ri-body { padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; }

    /* ── shared textarea ── */
    .ri-ta {
      width: 100%; box-sizing: border-box; resize: vertical;
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); color: var(--lumiverse-text);
      font-size: 12.5px; font-family: inherit; padding: 6px 9px; outline: none;
      transition: border-color 0.14s;
    }
    .ri-ta:focus { border-color: var(--lumiverse-accent); }
    #ri-instr-ta { min-height: 72px; }
    #ri-dir-ta { min-height: 44px; }

    /* ── WFM: current message preview ── */
    .ri-preview {
      background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius); padding: 6px 9px;
      font-size: 12px; color: var(--lumiverse-text-muted);
      max-height: 72px; overflow-y: auto;
      white-space: pre-wrap; word-break: break-word;
    }
    .ri-preview-label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--lumiverse-text-dim); margin-bottom: 3px; font-weight: 600;
    }

    /* ── WFM draft nav ── */
    .ri-draft-nav {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 11.5px; color: var(--lumiverse-text-muted);
    }
    .ri-nav-btn {
      background: none; border: none; color: var(--lumiverse-text-dim);
      cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 3px;
      transition: color 0.12s, background 0.12s;
    }
    .ri-nav-btn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
    .ri-nav-btn:disabled { opacity: 0.3; cursor: default; }

    /* ── WFM action row ── */
    .ri-wfm-actions { display: flex; gap: 6px; }
    .ri-btn {
      flex: 1; padding: 6px 10px; border-radius: var(--lumiverse-radius);
      font-size: 12px; font-family: inherit; cursor: pointer;
      transition: background 0.13s, border-color 0.13s; line-height: 1;
    }
    .ri-btn-gen {
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle); color: var(--lumiverse-text-muted);
    }
    .ri-btn-gen:hover { background: var(--lumiverse-fill); color: var(--lumiverse-text); }
    .ri-btn-gen:disabled { opacity: 0.4; cursor: default; }
    .ri-btn-use {
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent);
    }
    .ri-btn-use:hover { background: color-mix(in srgb, var(--lumiverse-accent) 26%, transparent); }
    .ri-btn-use:disabled { opacity: 0.4; cursor: default; }
    .ri-status { font-size: 11px; color: var(--lumiverse-text-dim); min-height: 13px; text-align: center; }

    /* ── preset modal content ── */
    .ri-preset-list { display: flex; flex-direction: column; gap: 3px; max-height: 200px; overflow-y: auto; }
    .ri-preset-row {
      display: flex; align-items: center; gap: 6px; padding: 5px 8px;
      border-radius: var(--lumiverse-radius); cursor: pointer; font-size: 12.5px;
      color: var(--lumiverse-text); transition: background 0.12s;
    }
    .ri-preset-row:hover { background: var(--lumiverse-fill-subtle); }
    .ri-preset-del {
      margin-left: auto; background: none; border: none;
      color: var(--lumiverse-text-dim); cursor: pointer; font-size: 11px; padding: 0 2px;
    }
    .ri-preset-del:hover { color: #f87171; }
    .ri-preset-save {
      display: flex; gap: 6px; margin-top: 8px;
    }
    .ri-preset-save input {
      flex: 1; background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius);
      color: var(--lumiverse-text); font-size: 12px; font-family: inherit;
      padding: 5px 8px; outline: none;
    }
    .ri-preset-save input:focus { border-color: var(--lumiverse-accent); }
    .ri-preset-save button {
      padding: 5px 10px; border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-accent);
      background: color-mix(in srgb, var(--lumiverse-accent) 14%, transparent);
      color: var(--lumiverse-accent); font-size: 12px; font-family: inherit; cursor: pointer;
    }
  `);

  // ─── Build toolbar (icon buttons only) ────────────────────────────────────────
  function buildToolbar() {
    const el = document.createElement('div');
    el.id = 'ri-toolbar';
    el.innerHTML = `
      <button class="ri-icon-btn" id="ri-btn-ri" title="Response Instructions">
        📋<span class="ri-dot"></span>
      </button>
      <div id="ri-divider"></div>
      <button class="ri-icon-btn" id="ri-btn-wfm" title="Write For Me">✦</button>
    `;
    el.querySelector('#ri-btn-ri').onclick  = () => togglePanel('ri');
    el.querySelector('#ri-btn-wfm').onclick = () => togglePanel('wfm');
    return el;
  }

  // ─── Build panel ─────────────────────────────────────────────────────────────
  function buildPanel() {
    const el = document.createElement('div');
    el.id = 'ri-panel';
    el.innerHTML = `
      <!-- RI tab -->
      <div id="ri-tab-ri">
        <div class="ri-header">
          <span class="ri-header-icon">📋</span>
          <span class="ri-header-title">Response Instructions</span>
          <label class="ri-toggle" title="Enable/disable">
            <input type="checkbox" id="ri-chk">
            <span class="ri-toggle-track"></span>
            <span class="ri-toggle-thumb"></span>
          </label>
          <button class="ri-header-btn" id="ri-preset-btn" title="Presets">📁</button>
          <button class="ri-header-btn" id="ri-clear-btn" title="Clear">🗑</button>
          <button class="ri-header-btn" id="ri-close-ri" title="Close">✕</button>
        </div>
        <div class="ri-body">
          <textarea class="ri-ta" id="ri-instr-ta" placeholder="Write response instructions here… No character limit. Injected via interceptor for the next reply."></textarea>
        </div>
      </div>

      <!-- WFM tab -->
      <div id="ri-tab-wfm" style="display:none;">
        <div class="ri-header">
          <span class="ri-header-icon">✦</span>
          <span class="ri-header-title">Write For Me</span>
          <button class="ri-header-btn" id="ri-close-wfm" title="Close">✕</button>
        </div>
        <div class="ri-body">
          <div>
            <div class="ri-preview-label">Your message</div>
            <div class="ri-preview" id="ri-preview">—</div>
          </div>
          <div class="ri-draft-nav">
            <button class="ri-nav-btn" id="ri-prev" title="Previous draft">⏮</button>
            <span id="ri-draft-label">No drafts</span>
            <button class="ri-nav-btn" id="ri-next" title="Next draft">⏭</button>
          </div>
          <div>
            <div class="ri-preview-label">Instruction</div>
            <textarea class="ri-ta" id="ri-dir-ta" placeholder="e.g. 'act shy and nervous', 'confess my feelings'…"></textarea>
          </div>
          <div class="ri-wfm-actions">
            <button class="ri-btn ri-btn-gen" id="ri-gen">✦ Generate</button>
            <button class="ri-btn ri-btn-use" id="ri-use" disabled>✓ Use this</button>
          </div>
          <div class="ri-status" id="ri-status"></div>
        </div>
      </div>
    `;

    // RI tab wiring
    const ta  = el.querySelector('#ri-instr-ta');
    const chk = el.querySelector('#ri-chk');
    ta.oninput  = () => { state.instruction = ta.value; push(); };
    chk.onchange = () => {
      state.enabled = chk.checked;
      refreshRiBtn(); push();
    };
    el.querySelector('#ri-clear-btn').onclick = () => {
      state.instruction = ''; state.enabled = false;
      ta.value = ''; chk.checked = false;
      refreshRiBtn(); push();
    };
    el.querySelector('#ri-preset-btn').onclick = openPresets;
    el.querySelector('#ri-close-ri').onclick   = () => closePanel();
    el.querySelector('#ri-close-wfm').onclick  = () => closePanel();

    // WFM wiring
    el.querySelector('#ri-dir-ta').oninput = (e) => { state.wfm_direction = e.target.value; };
    el.querySelector('#ri-gen').onclick = generate;
    el.querySelector('#ri-use').onclick = () => {
      if (drafts.length) insertDraft(drafts[draftIdx]);
    };
    el.querySelector('#ri-prev').onclick = () => { if (draftIdx > 0) { draftIdx--; renderDraftNav(); } };
    el.querySelector('#ri-next').onclick = () => { if (draftIdx < drafts.length - 1) { draftIdx++; renderDraftNav(); } };

    return el;
  }

  function applyStateToUI() {
    const ta  = document.getElementById('ri-instr-ta');
    const chk = document.getElementById('ri-chk');
    const dir = document.getElementById('ri-dir-ta');
    if (ta)  ta.value    = state.instruction;
    if (chk) chk.checked = state.enabled;
    if (dir) dir.value   = state.wfm_direction;
    refreshRiBtn();
    updatePreview();
  }

  // ─── Panel open/close ─────────────────────────────────────────────────────────
  function togglePanel(tab) {
    if (panelOpen && activeTab === tab) { closePanel(); return; }
    activeTab = tab;
    panelOpen = true;
    document.getElementById('ri-panel')?.classList.add('ri-open');
    document.getElementById('ri-tab-ri').style.display  = tab === 'ri'  ? 'block' : 'none';
    document.getElementById('ri-tab-wfm').style.display = tab === 'wfm' ? 'block' : 'none';
    if (tab === 'wfm') updatePreview();
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
    btn.classList.toggle('ri-on', panelOpen && activeTab === 'ri');
    btn.classList.toggle('ri-enabled', state.enabled);
  }
  function refreshBtns() {
    refreshRiBtn();
    document.getElementById('ri-btn-wfm')?.classList.toggle('ri-on', panelOpen && activeTab === 'wfm');
  }

  // ─── WFM ─────────────────────────────────────────────────────────────────────
  function updatePreview() {
    const ta = document.querySelector('textarea[name="chat-message"]');
    const preview = document.getElementById('ri-preview');
    if (!preview) return;
    const text = ta?.value?.trim() || '';
    preview.textContent = text || '(empty)';
  }

  function renderDraftNav() {
    const label   = document.getElementById('ri-draft-label');
    const useBtn  = document.getElementById('ri-use');
    const prevBtn = document.getElementById('ri-prev');
    const nextBtn = document.getElementById('ri-next');
    if (!label) return;
    if (!drafts.length) {
      label.textContent = 'No drafts';
      if (useBtn)  useBtn.disabled  = true;
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }
    label.textContent = `Draft ${draftIdx + 1} / ${drafts.length}`;
    if (useBtn)  useBtn.disabled  = false;
    if (prevBtn) prevBtn.disabled = draftIdx === 0;
    if (nextBtn) nextBtn.disabled = draftIdx === drafts.length - 1;
  }

  async function generate() {
    if (generating) return;
    generating = true;
    const genBtn = document.getElementById('ri-gen');
    const status = document.getElementById('ri-status');
    if (genBtn) { genBtn.disabled = true; genBtn.textContent = '…'; }
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

  // ─── Presets ──────────────────────────────────────────────────────────────────
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
        row.innerHTML = `<span style="flex:1;">${esc(name)}</span><button class="ri-preset-del" title="Delete">✕</button>`;
        row.querySelector('span').onclick    = () => { loadPreset(name); presetModal?.dismiss(); };
        row.querySelector('button').onclick  = (e) => { e.stopPropagation(); delete state.presets[name]; push(); renderPresetContent(); };
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
    ctx.sendToBackend({ type: 'ri:update', ...state });
  }

  const unsubMsg = ctx.onBackendMessage((payload) => {
    if (payload.type === 'ri:state') {
      state = { ...state, ...payload.state };
      applyStateToUI();
      ctx.sendToBackend({ type: 'ri:update', ...state });
    }
    if (payload.type === 'ri:draft') {
      generating = false;
      const genBtn = document.getElementById('ri-gen');
      const status = document.getElementById('ri-status');
      if (genBtn) { genBtn.disabled = false; genBtn.textContent = '✦ Generate'; }
      if (payload.error) {
        if (status) status.textContent = `Error: ${payload.error}`;
        return;
      }
      drafts.push(payload.text);
      draftIdx = drafts.length - 1;
      if (status) status.textContent = '';
      renderDraftNav();
    }
  });

  // ─── Mount ────────────────────────────────────────────────────────────────────
  function mount() {
    if (document.getElementById('ri-toolbar')) return;
    const slot     = document.querySelector('[data-spindle-mount="chat_composer_above"]');
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

  const obs = new MutationObserver(() => {
    if (!document.getElementById('ri-toolbar')) mount();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  mount();

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
