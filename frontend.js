// Response Instructions + Write For Me — Lumiverse Spindle Frontend v2.0
//
// UI strategy (learned from notehaven):
//   - Self-render a draggable float widget directly onto document.body
//   - Open/close via an input-bar action (free-tier, no permission needed)
//   - No dock panel, no ui_panels permission required
//   - Storage is free-tier — no permission needed
//
// Widget appearance: compact draggable panel, two tabs (Instructions / Write For Me),
// snaps to screen edges on release.

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

  let activeTab = 'ri'; // 'ri' | 'wfm'
  let widgetVisible = false;
  let widgetEl = null;

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #ri-widget {
      position: fixed;
      z-index: 99999;
      width: 340px;
      max-width: calc(100vw - 24px);
      background: var(--lumiverse-bg, #1a1a2e);
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      font-family: inherit;
      font-size: 13px;
      color: var(--lumiverse-text, #e0e0f0);
      display: none;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }
    #ri-widget.visible { display: flex; }

    /* drag handle / header */
    #ri-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px 6px;
      cursor: grab;
      background: var(--lumiverse-fill-subtle, rgba(255,255,255,0.04));
      border-bottom: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      flex-shrink: 0;
    }
    #ri-header:active { cursor: grabbing; }
    #ri-drag-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.45));
      text-transform: uppercase;
      flex: 1;
    }
    #ri-close-btn {
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0;
      transition: background 0.12s, color 0.12s;
    }
    #ri-close-btn:hover {
      background: var(--lumiverse-fill, rgba(255,255,255,0.08));
      color: var(--lumiverse-text, #e0e0f0);
    }

    /* tab row */
    #ri-tabs {
      display: flex;
      padding: 6px 10px 0;
      gap: 4px;
      flex-shrink: 0;
    }
    .ri-tab {
      flex: 1;
      padding: 5px 8px;
      border-radius: 7px 7px 0 0;
      border: 1px solid transparent;
      border-bottom: none;
      background: transparent;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      font-weight: 500;
      transition: all 0.12s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .ri-tab:hover {
      color: var(--lumiverse-text, #e0e0f0);
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
    }
    .ri-tab.active {
      background: var(--lumiverse-fill-subtle, rgba(255,255,255,0.07));
      border-color: var(--lumiverse-border, rgba(255,255,255,0.12));
      color: var(--lumiverse-text, #e0e0f0);
    }
    .ri-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4caf50;
      display: none;
      flex-shrink: 0;
    }
    .ri-dot.on { display: block; }

    /* body */
    #ri-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      max-height: 420px;
    }

    /* panels */
    .ri-panel { display: none; flex-direction: column; gap: 8px; }
    .ri-panel.active { display: flex; }

    /* toolbar */
    .ri-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ri-toggle {
      padding: 3px 11px;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.45));
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.04em;
      transition: all 0.12s;
    }
    .ri-toggle.on {
      background: color-mix(in srgb, var(--lumiverse-accent, #6c63ff) 20%, transparent);
      border-color: var(--lumiverse-accent, #6c63ff);
      color: var(--lumiverse-accent, #6c63ff);
    }
    .ri-spacer { flex: 1; }
    .ri-icon-btn {
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.05));
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 13px;
      padding: 0;
      transition: all 0.12s;
      flex-shrink: 0;
    }
    .ri-icon-btn:hover {
      background: var(--lumiverse-fill-hover, rgba(255,255,255,0.1));
      color: var(--lumiverse-text, #e0e0f0);
    }
    .ri-icon-btn.danger:hover { color: #e05050; }

    /* textarea */
    .ri-textarea {
      width: 100%;
      min-height: 72px;
      max-height: 160px;
      resize: vertical;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.05));
      color: var(--lumiverse-text, #e0e0f0);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.12s;
      user-select: text;
    }
    .ri-textarea:focus { border-color: var(--lumiverse-accent, #6c63ff); }
    .ri-textarea::placeholder { color: var(--lumiverse-text-dim, rgba(255,255,255,0.3)); }

    /* WFM draft nav */
    .wfm-nav {
      display: none;
      align-items: center;
      gap: 4px;
    }
    .wfm-nav.visible { display: flex; }
    .wfm-counter {
      font-size: 11px;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      min-width: 32px;
      text-align: center;
    }

    /* WFM actions */
    .wfm-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .wfm-btn {
      padding: 5px 14px;
      border-radius: 7px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text, #e0e0f0);
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      transition: all 0.12s;
    }
    .wfm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .wfm-btn.primary {
      background: var(--lumiverse-accent, #6c63ff);
      border-color: var(--lumiverse-accent, #6c63ff);
      color: #fff;
    }
    .wfm-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
    .wfm-loading {
      font-size: 11px;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      font-style: italic;
      display: none;
    }
    .wfm-loading.visible { display: inline; }

    /* preset modal list */
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
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.05));
      cursor: pointer;
      transition: background 0.1s;
    }
    .ri-preset-row:hover { background: var(--lumiverse-fill-hover, rgba(255,255,255,0.09)); }
    .ri-preset-name {
      flex: 1;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ri-preset-del {
      font-size: 13px;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.35));
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.1s;
      flex-shrink: 0;
    }
    .ri-preset-del:hover { color: #e05050; }
    .ri-preset-empty {
      text-align: center;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.35));
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
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text, #e0e0f0);
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }
    .ri-preset-input:focus { border-color: var(--lumiverse-accent, #6c63ff); }
  `;
  document.head.appendChild(styleEl);

  // ─── Widget DOM ──────────────────────────────────────────────────────────────

  widgetEl = document.createElement('div');
  widgetEl.id = 'ri-widget';
  widgetEl.innerHTML = `
    <div id="ri-header">
      <span id="ri-drag-label">✦ RI + WFM</span>
      <button id="ri-close-btn" title="Close">✕</button>
    </div>
    <div id="ri-tabs">
      <button class="ri-tab active" data-tab="ri">
        <span class="ri-dot" id="ri-dot"></span>
        Instructions
      </button>
      <button class="ri-tab" data-tab="wfm">Write For Me</button>
    </div>
    <div id="ri-body">
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
          placeholder="Draft appears here…" style="min-height:80px"></textarea>
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
  document.body.appendChild(widgetEl);

  // ─── Position widget ─────────────────────────────────────────────────────────

  function positionWidget() {
    const margin = 16;
    widgetEl.style.bottom = (margin + 60) + 'px'; // above chat bar roughly
    widgetEl.style.right = margin + 'px';
  }
  positionWidget();

  // ─── Dragging ────────────────────────────────────────────────────────────────

  const header = widgetEl.querySelector('#ri-header');
  let dragging = false, dragOffX = 0, dragOffY = 0;

  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true;
    const rect = widgetEl.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    widgetEl.style.right = '';
    widgetEl.style.bottom = '';
    widgetEl.style.left = rect.left + 'px';
    widgetEl.style.top = rect.top + 'px';
    header.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  header.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - widgetEl.offsetWidth, e.clientX - dragOffX));
    const y = Math.max(0, Math.min(window.innerHeight - widgetEl.offsetHeight, e.clientY - dragOffY));
    widgetEl.style.left = x + 'px';
    widgetEl.style.top = y + 'px';
  });

  header.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    snapToEdge();
  });

  function snapToEdge() {
    const rect = widgetEl.getBoundingClientRect();
    const margin = 12;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const snapRight = cx > window.innerWidth / 2;
    const snapBottom = cy > window.innerHeight / 2;

    widgetEl.style.left = '';
    widgetEl.style.top = '';
    widgetEl.style.right = snapRight ? margin + 'px' : '';
    widgetEl.style.bottom = snapBottom ? margin + 'px' : '';
    if (!snapRight) widgetEl.style.left = margin + 'px';
    if (!snapBottom) widgetEl.style.top = margin + 'px';
  }

  // ─── Show / hide ─────────────────────────────────────────────────────────────

  function showWidget() {
    widgetEl.classList.add('visible');
    widgetVisible = true;
    riTextarea.focus();
  }

  function hideWidget() {
    widgetEl.classList.remove('visible');
    widgetVisible = false;
  }

  widgetEl.querySelector('#ri-close-btn').addEventListener('click', hideWidget);

  // ─── Input bar action ────────────────────────────────────────────────────────

  const action = ctx.ui.registerInputBarAction({
    id: 'ri-open',
    label: 'Response Instructions',
    iconSvg: `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="5.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="9" width="11" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>`,
  });

  const unsubAction = action.onClick(() => {
    if (widgetVisible) hideWidget(); else showWidget();
  });

  // Also register a Write For Me action
  const wfmAction = ctx.ui.registerInputBarAction({
    id: 'wfm-open',
    label: 'Write For Me',
    iconSvg: `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 10.5L4 8.5L10 2.5C10.55 1.95 11.45 1.95 12 2.5C12.55 3.05 12.55 3.95 12 4.5L6 10.5L2 12L2 10.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>`,
  });

  const unsubWfmAction = wfmAction.onClick(() => {
    if (!widgetVisible) showWidget();
    switchTab('wfm');
  });

  // ─── Tabs ────────────────────────────────────────────────────────────────────

  function switchTab(tab) {
    activeTab = tab;
    widgetEl.querySelectorAll('.ri-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    widgetEl.querySelectorAll('.ri-panel').forEach(p => p.classList.remove('active'));
    widgetEl.querySelector(tab === 'ri' ? '#ri-panel' : '#wfm-panel').classList.add('active');
  }

  widgetEl.querySelectorAll('.ri-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ─── Element refs ─────────────────────────────────────────────────────────────

  const riDot      = widgetEl.querySelector('#ri-dot');
  const riToggle   = widgetEl.querySelector('#ri-toggle');
  const riTextarea = widgetEl.querySelector('#ri-textarea');
  const riClearBtn = widgetEl.querySelector('#ri-clear-btn');
  const riPresetsBtn = widgetEl.querySelector('#ri-presets-btn');

  const wfmInstruction = widgetEl.querySelector('#wfm-instruction');
  const wfmDraft       = widgetEl.querySelector('#wfm-draft');
  const wfmNav         = widgetEl.querySelector('#wfm-nav');
  const wfmCounter     = widgetEl.querySelector('#wfm-counter');
  const wfmPrev        = widgetEl.querySelector('#wfm-prev');
  const wfmNext        = widgetEl.querySelector('#wfm-next');
  const wfmGenerate    = widgetEl.querySelector('#wfm-generate');
  const wfmUse         = widgetEl.querySelector('#wfm-use');
  const wfmLoadingEl   = widgetEl.querySelector('#wfm-loading');
  const wfmPresetsBtn  = widgetEl.querySelector('#wfm-presets-btn');

  // Prevent drag from swallowing textarea input
  [riTextarea, wfmInstruction, wfmDraft].forEach(el => {
    el.addEventListener('pointerdown', e => e.stopPropagation());
  });

  // ─── RI logic ─────────────────────────────────────────────────────────────────

  function syncRI() {
    ctx.sendToBackend({ type: 'ri:set', text: riText, enabled: riEnabled });
    riDot.classList.toggle('on', riEnabled);
    riToggle.textContent = riEnabled ? 'ON' : 'OFF';
    riToggle.classList.toggle('on', riEnabled);
  }

  riToggle.addEventListener('click', () => { riEnabled = !riEnabled; syncRI(); });

  riTextarea.addEventListener('input', () => { riText = riTextarea.value; syncRI(); });

  riClearBtn.addEventListener('click', () => {
    riText = ''; riEnabled = false;
    riTextarea.value = '';
    syncRI();
  });

  // ─── WFM logic ────────────────────────────────────────────────────────────────

  function updateWfmDraftUI() {
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

  wfmPrev.addEventListener('click', () => { if (wfmDraftIdx > 0) { wfmDraftIdx--; updateWfmDraftUI(); } });
  wfmNext.addEventListener('click', () => { if (wfmDraftIdx < wfmDrafts.length - 1) { wfmDraftIdx++; updateWfmDraftUI(); } });

  wfmDraft.addEventListener('input', () => { if (wfmDrafts.length > 0) wfmDrafts[wfmDraftIdx] = wfmDraft.value; });

  wfmUse.addEventListener('click', () => {
    const text = wfmDraft.value.trim();
    if (!text) return;
    // Try known Lumiverse chat input selectors
    const inp = document.querySelector('[data-testid="chat-input"] textarea, textarea.chat-input, #chat-input textarea, .lumi-chat-input textarea');
    if (inp) {
      inp.value = text;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.focus();
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
    hideWidget();
  });

  // ─── Presets ──────────────────────────────────────────────────────────────────

  let pendingPresetStore = null;

  riPresetsBtn.addEventListener('click', () => {
    pendingPresetStore = 'ri';
    ctx.sendToBackend({ type: 'preset:load', store: 'ri' });
  });
  wfmPresetsBtn.addEventListener('click', () => {
    pendingPresetStore = 'wfm';
    ctx.sendToBackend({ type: 'preset:load', store: 'wfm' });
  });

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
          const name = row.dataset.name;
          const text = presets[name] ?? '';
          if (isRi) { riText = text; riTextarea.value = text; syncRI(); }
          else { wfmInstruction.value = text; }
          modal.dismiss();
        });
      });

      modal.root.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.dataset.del;
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

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ─── Backend messages ──────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    // Presets loaded → open modal if this was a user-triggered load
    if (payload.type === 'preset:data') {
      if (payload.store === 'ri') riPresets = payload.data;
      else wfmPresets = payload.data;
      if (pendingPresetStore === payload.store) {
        pendingPresetStore = null;
        showPresetModal(payload.store, payload.store === 'ri' ? riPresets : wfmPresets);
      }
      return;
    }

    // WFM result
    if (payload.type === 'wfm:result' && payload.requestId === wfmPendingId) {
      wfmLoading = false;
      wfmGenerate.disabled = false;
      wfmLoadingEl.classList.remove('visible');
      wfmDrafts.push(payload.text);
      wfmDraftIdx = wfmDrafts.length - 1;
      updateWfmDraftUI();
      wfmPendingId = null;
      return;
    }

    // WFM error
    if (payload.type === 'wfm:error' && payload.requestId === wfmPendingId) {
      wfmLoading = false;
      wfmGenerate.disabled = false;
      wfmLoadingEl.classList.remove('visible');
      wfmDraft.value = `Error: ${payload.error}`;
      wfmPendingId = null;
      return;
    }
  });

  // Load presets silently on boot
  ctx.sendToBackend({ type: 'preset:load', store: 'ri' });
  ctx.sendToBackend({ type: 'preset:load', store: 'wfm' });

  // ─── Cleanup ──────────────────────────────────────────────────────────────────

  return () => {
    unsubBackend();
    unsubAction();
    unsubWfmAction();
    action.destroy();
    wfmAction.destroy();
    widgetEl?.remove();
    styleEl?.remove();
  };
}
