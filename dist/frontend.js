// Response Instructions + Write For Me — Lumiverse Spindle Frontend v2.0
//
// UI: self-rendered draggable button widget on the page (like notehaven Halo)
//     clicking it activates a drawer tab (free-tier, no permissions needed)

export function setup(ctx) {

  // ─── State ──────────────────────────────────────────────────────────────────

  let riText = '';
  let riEnabled = false;
  let riPresets = {};
  let wfmPresets = {};
  let wfmDrafts = [];
  let wfmDraftIdx = 0;
  let wfmLoading = false;
  let wfmPendingId = null;
  let pendingPresetStore = null;

  // ─── Drawer Tab ──────────────────────────────────────────────────────────────

  const tab = ctx.ui.registerDrawerTab({
    id: 'ri-wfm',
    title: 'Response Instructions',
    shortName: 'RI',
    description: 'Steer AI replies and draft your own messages',
    keywords: ['instructions', 'response', 'write for me', 'prompt', 'steer'],
    headerTitle: 'RI + WFM',
    iconSvg: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor"/>
      <rect x="2" y="9" width="11" height="2" rx="1" fill="currentColor"/>
      <rect x="2" y="14" width="13" height="2" rx="1" fill="currentColor"/>
    </svg>`,
  });

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const removeStyle = ctx.dom.addStyle(`
    .ri-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-size: 13px;
      color: var(--lumiverse-text);
      overflow: hidden;
    }

    /* inner tab switcher */
    .ri-tabs {
      display: flex;
      border-bottom: 1px solid var(--lumiverse-border);
      flex-shrink: 0;
    }
    .ri-tab-btn {
      flex: 1;
      padding: 9px 8px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      transition: all 0.12s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .ri-tab-btn:hover { color: var(--lumiverse-text); }
    .ri-tab-btn.active {
      color: var(--lumiverse-accent);
      border-bottom-color: var(--lumiverse-accent);
    }
    .ri-on-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4caf50;
      display: none;
      flex-shrink: 0;
    }
    .ri-on-dot.on { display: block; }

    /* panels */
    .ri-panel {
      display: none;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .ri-panel.active { display: flex; }

    /* toolbar */
    .ri-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ri-toggle {
      padding: 3px 12px;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.04em;
      transition: all 0.12s;
    }
    .ri-toggle.on {
      background: color-mix(in srgb, var(--lumiverse-accent) 18%, transparent);
      border-color: var(--lumiverse-accent);
      color: var(--lumiverse-accent);
    }
    .ri-spacer { flex: 1; }
    .ri-icon-btn {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      transition: all 0.12s;
      flex-shrink: 0;
    }
    .ri-icon-btn:hover {
      background: var(--lumiverse-fill-hover, var(--lumiverse-fill));
      color: var(--lumiverse-text);
    }
    .ri-icon-btn.danger:hover { color: #e05050; }

    /* textarea */
    .ri-textarea {
      width: 100%;
      min-height: 80px;
      resize: vertical;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.12s;
    }
    .ri-textarea:focus { border-color: var(--lumiverse-accent); }
    .ri-textarea::placeholder { color: var(--lumiverse-text-dim); }

    /* wfm draft nav */
    .wfm-nav {
      display: none;
      align-items: center;
      gap: 4px;
    }
    .wfm-nav.visible { display: flex; }
    .wfm-counter {
      font-size: 11px;
      color: var(--lumiverse-text-dim);
      min-width: 36px;
      text-align: center;
    }

    /* wfm actions */
    .wfm-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .wfm-btn {
      padding: 5px 14px;
      border-radius: 7px;
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      transition: all 0.12s;
    }
    .wfm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .wfm-btn.primary {
      background: var(--lumiverse-accent);
      border-color: var(--lumiverse-accent);
      color: #fff;
    }
    .wfm-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
    .wfm-loading {
      font-size: 11px;
      color: var(--lumiverse-text-dim);
      font-style: italic;
      display: none;
    }
    .wfm-loading.visible { display: inline; }

    /* preset modal */
    .ri-preset-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 8px;
    }
    .ri-preset-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      cursor: pointer;
      transition: background 0.1s;
    }
    .ri-preset-row:hover { background: var(--lumiverse-fill-hover, var(--lumiverse-fill)); }
    .ri-preset-name {
      flex: 1;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ri-preset-del {
      font-size: 13px;
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.1s;
      flex-shrink: 0;
    }
    .ri-preset-del:hover { color: #e05050; }
    .ri-preset-empty {
      text-align: center;
      color: var(--lumiverse-text-dim);
      font-size: 13px;
      padding: 14px 0;
    }
    .ri-preset-save-row {
      display: flex;
      gap: 6px;
    }
    .ri-preset-input {
      flex: 1;
      padding: 5px 10px;
      border-radius: 7px;
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }
    .ri-preset-input:focus { border-color: var(--lumiverse-accent); }

    /* self-rendered button widget */
    #ri-float-btn {
      position: fixed;
      z-index: 99999;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--lumiverse-accent, #6c63ff);
      border: 2px solid color-mix(in srgb, var(--lumiverse-accent, #6c63ff) 60%, white);
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 18px;
      user-select: none;
      touch-action: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #ri-float-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0,0,0,0.45);
    }
    #ri-float-btn.active {
      background: color-mix(in srgb, var(--lumiverse-accent, #6c63ff) 80%, white);
    }
    #ri-float-btn .ri-btn-dot {
      position: absolute;
      top: 2px; right: 2px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #4caf50;
      border: 1.5px solid var(--lumiverse-bg, #1a1a2e);
      display: none;
    }
    #ri-float-btn .ri-btn-dot.on { display: block; }
  `);

  // ─── Drawer Tab Content ──────────────────────────────────────────────────────

  tab.root.innerHTML = `
    <div class="ri-root">
      <div class="ri-tabs">
        <button class="ri-tab-btn active" data-tab="ri">
          <span class="ri-on-dot" id="ri-on-dot"></span>
          Instructions
        </button>
        <button class="ri-tab-btn" data-tab="wfm">Write For Me</button>
      </div>

      <!-- RI panel -->
      <div class="ri-panel active" id="ri-panel">
        <div class="ri-toolbar">
          <button class="ri-toggle" id="ri-toggle">OFF</button>
          <span class="ri-spacer"></span>
          <button class="ri-icon-btn" id="ri-presets-btn" title="Presets">📁</button>
          <button class="ri-icon-btn danger" id="ri-clear-btn" title="Clear">🗑</button>
        </div>
        <textarea class="ri-textarea" id="ri-textarea"
          placeholder="Steer the AI's next reply — no character limit.&#10;e.g. 'respond shyly and avoid eye contact'"></textarea>
      </div>

      <!-- WFM panel -->
      <div class="ri-panel" id="wfm-panel">
        <div class="ri-toolbar">
          <span class="ri-spacer"></span>
          <button class="ri-icon-btn" id="wfm-presets-btn" title="Presets">📁</button>
        </div>
        <textarea class="ri-textarea" id="wfm-instruction"
          placeholder="Optional: how to write it&#10;e.g. 'act nervous, avoid eye contact'"></textarea>
        <textarea class="ri-textarea" id="wfm-draft"
          placeholder="Draft appears here…" style="min-height:90px"></textarea>
        <div class="wfm-nav" id="wfm-nav">
          <button class="ri-icon-btn" id="wfm-prev">‹</button>
          <span class="wfm-counter" id="wfm-counter">1 / 1</span>
          <button class="ri-icon-btn" id="wfm-next">›</button>
        </div>
        <div class="wfm-actions">
          <button class="wfm-btn primary" id="wfm-generate">Generate</button>
          <button class="wfm-btn" id="wfm-use" disabled>Use this</button>
          <span class="wfm-loading" id="wfm-loading">generating…</span>
        </div>
      </div>
    </div>
  `;

  // ─── Element refs ─────────────────────────────────────────────────────────────

  const q = (sel) => tab.root.querySelector(sel);

  const riOnDot    = q('#ri-on-dot');
  const riToggle   = q('#ri-toggle');
  const riTextarea = q('#ri-textarea');
  const riClearBtn = q('#ri-clear-btn');
  const riPresetsBtn = q('#ri-presets-btn');

  const wfmInstruction = q('#wfm-instruction');
  const wfmDraft       = q('#wfm-draft');
  const wfmNav         = q('#wfm-nav');
  const wfmCounter     = q('#wfm-counter');
  const wfmPrev        = q('#wfm-prev');
  const wfmNext        = q('#wfm-next');
  const wfmGenerate    = q('#wfm-generate');
  const wfmUse         = q('#wfm-use');
  const wfmLoadingEl   = q('#wfm-loading');
  const wfmPresetsBtn  = q('#wfm-presets-btn');

  // ─── Inner tab switcher ──────────────────────────────────────────────────────

  tab.root.querySelectorAll('.ri-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tab.root.querySelectorAll('.ri-tab-btn').forEach(b => b.classList.remove('active'));
      tab.root.querySelectorAll('.ri-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      tab.root.querySelector(btn.dataset.tab === 'ri' ? '#ri-panel' : '#wfm-panel').classList.add('active');
    });
  });

  // ─── Self-rendered float button ──────────────────────────────────────────────
  // Like notehaven's Halo — renders itself onto document.body, no permissions needed.

  const btn = document.createElement('div');
  btn.id = 'ri-float-btn';
  btn.title = 'Response Instructions';
  btn.innerHTML = `✦<span class="ri-btn-dot" id="ri-btn-dot"></span>`;
  btn.style.bottom = '80px';
  btn.style.right = '16px';
  document.body.appendChild(btn);

  const btnDot = btn.querySelector('#ri-btn-dot');

  // drag
  let dragging = false, dragOffX = 0, dragOffY = 0, didDrag = false;

  btn.addEventListener('pointerdown', (e) => {
    dragging = true; didDrag = false;
    const rect = btn.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    btn.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  btn.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    didDrag = true;
    btn.style.right = ''; btn.style.bottom = '';
    btn.style.left = Math.max(0, Math.min(window.innerWidth - 44, e.clientX - dragOffX)) + 'px';
    btn.style.top  = Math.max(0, Math.min(window.innerHeight - 44, e.clientY - dragOffY)) + 'px';
  });

  btn.addEventListener('pointerup', () => {
    dragging = false;
    if (didDrag) { snapBtn(); return; }
    // tap — activate the drawer tab
    tab.activate();
    btn.classList.add('active');
  });

  function snapBtn() {
    const rect = btn.getBoundingClientRect();
    const margin = 12;
    const snapRight = (rect.left + rect.width / 2) > window.innerWidth / 2;
    const snapBottom = (rect.top + rect.height / 2) > window.innerHeight / 2;
    btn.style.left = ''; btn.style.top = ''; btn.style.right = ''; btn.style.bottom = '';
    btn.style.right  = snapRight  ? margin + 'px' : '';
    btn.style.left   = snapRight  ? '' : margin + 'px';
    btn.style.bottom = snapBottom ? margin + 'px' : '';
    btn.style.top    = snapBottom ? '' : margin + 'px';
  }

  // remove active highlight when user switches away from the tab
  const unsubActivate = tab.onActivate(() => btn.classList.add('active'));

  // ─── RI logic ─────────────────────────────────────────────────────────────────

  function syncRI() {
    ctx.sendToBackend({ type: 'ri:set', text: riText, enabled: riEnabled });
    riOnDot.classList.toggle('on', riEnabled);
    btnDot.classList.toggle('on', riEnabled);
    riToggle.textContent = riEnabled ? 'ON' : 'OFF';
    riToggle.classList.toggle('on', riEnabled);
    tab.setBadge(riEnabled ? '●' : null);
  }

  riToggle.addEventListener('click', () => { riEnabled = !riEnabled; syncRI(); });
  riTextarea.addEventListener('input', () => { riText = riTextarea.value; syncRI(); });
  riClearBtn.addEventListener('click', () => {
    riText = ''; riEnabled = false; riTextarea.value = ''; syncRI();
  });

  // ─── WFM logic ────────────────────────────────────────────────────────────────

  function updateWfmUI() {
    const has = wfmDrafts.length > 0;
    wfmUse.disabled = !has;
    wfmNav.classList.toggle('visible', wfmDrafts.length > 1);
    if (has) {
      wfmDraft.value = wfmDrafts[wfmDraftIdx] ?? '';
      wfmCounter.textContent = `${wfmDraftIdx + 1} / ${wfmDrafts.length}`;
    }
  }

  wfmGenerate.addEventListener('click', () => {
    if (wfmLoading) return;
    wfmLoading = true;
    wfmGenerate.disabled = true;
    wfmLoadingEl.classList.add('visible');
    wfmPendingId = Math.random().toString(36).slice(2);
    ctx.sendToBackend({ type: 'wfm:generate', instruction: wfmInstruction.value.trim(), requestId: wfmPendingId });
  });

  wfmPrev.addEventListener('click', () => { if (wfmDraftIdx > 0) { wfmDraftIdx--; updateWfmUI(); } });
  wfmNext.addEventListener('click', () => { if (wfmDraftIdx < wfmDrafts.length - 1) { wfmDraftIdx++; updateWfmUI(); } });
  wfmDraft.addEventListener('input', () => { if (wfmDrafts.length > 0) wfmDrafts[wfmDraftIdx] = wfmDraft.value; });

  wfmUse.addEventListener('click', () => {
    const text = wfmDraft.value.trim();
    if (!text) return;
    const inp = document.querySelector('[data-testid="chat-input"] textarea, textarea.chat-input, #chat-input textarea, .lumi-chat-input textarea');
    if (inp) {
      inp.value = text;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.focus();
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  });

  // ─── Presets ──────────────────────────────────────────────────────────────────

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  riPresetsBtn.addEventListener('click', () => { pendingPresetStore = 'ri'; ctx.sendToBackend({ type: 'preset:load', store: 'ri' }); });
  wfmPresetsBtn.addEventListener('click', () => { pendingPresetStore = 'wfm'; ctx.sendToBackend({ type: 'preset:load', store: 'wfm' }); });

  function showPresetModal(store, presets) {
    const isRi = store === 'ri';
    const currentText = isRi ? riText : wfmInstruction.value;
    const modal = ctx.ui.showModal({ title: isRi ? 'RI Presets' : 'WFM Presets', width: 400, maxHeight: 480 });

    function render() {
      const names = Object.keys(presets);
      modal.root.innerHTML = `
        <div class="ri-preset-list">
          ${names.length === 0
            ? '<div class="ri-preset-empty">No presets yet.</div>'
            : names.map(n => `
              <div class="ri-preset-row" data-name="${esc(n)}">
                <span class="ri-preset-name">${esc(n)}</span>
                <span class="ri-preset-del" data-del="${esc(n)}">✕</span>
              </div>`).join('')}
        </div>
        <div class="ri-preset-save-row">
          <input class="ri-preset-input" id="pm-name" placeholder="Preset name…" />
          <button class="wfm-btn primary" id="pm-save">Save current</button>
        </div>
      `;
      modal.root.querySelectorAll('.ri-preset-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.dataset.del) return;
          const text = presets[row.dataset.name] ?? '';
          if (isRi) { riText = text; riTextarea.value = text; syncRI(); }
          else { wfmInstruction.value = text; }
          modal.dismiss();
        });
      });
      modal.root.querySelectorAll('[data-del]').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = b.dataset.del;
          ctx.sendToBackend({ type: 'preset:delete', store, name });
          delete presets[name];
          render();
        });
      });
      const pmSave = modal.root.querySelector('#pm-save');
      const pmName = modal.root.querySelector('#pm-name');
      pmSave.addEventListener('click', () => {
        const name = pmName.value.trim();
        if (!name) return;
        ctx.sendToBackend({ type: 'preset:save', store, name, text: currentText });
        presets[name] = currentText;
        pmName.value = '';
        render();
      });
    }
    render();
  }

  // ─── Backend messages ─────────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === 'preset:data') {
      if (payload.store === 'ri') riPresets = payload.data;
      else wfmPresets = payload.data;
      if (pendingPresetStore === payload.store) {
        pendingPresetStore = null;
        showPresetModal(payload.store, payload.store === 'ri' ? riPresets : wfmPresets);
      }
      return;
    }
    if (payload.type === 'wfm:result' && payload.requestId === wfmPendingId) {
      wfmLoading = false; wfmGenerate.disabled = false; wfmLoadingEl.classList.remove('visible');
      wfmDrafts.push(payload.text); wfmDraftIdx = wfmDrafts.length - 1;
      updateWfmUI(); wfmPendingId = null;
      return;
    }
    if (payload.type === 'wfm:error' && payload.requestId === wfmPendingId) {
      wfmLoading = false; wfmGenerate.disabled = false; wfmLoadingEl.classList.remove('visible');
      wfmDraft.value = `Error: ${payload.error}`; wfmPendingId = null;
      return;
    }
  });

  // load presets silently on boot
  ctx.sendToBackend({ type: 'preset:load', store: 'ri' });
  ctx.sendToBackend({ type: 'preset:load', store: 'wfm' });

  // ─── Cleanup ──────────────────────────────────────────────────────────────────

  return () => {
    unsubBackend();
    unsubActivate();
    tab.destroy();
    btn.remove();
    removeStyle();
  };
}
