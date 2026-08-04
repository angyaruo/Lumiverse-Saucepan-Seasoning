// Response Instructions + Write For Me — Lumiverse Spindle Frontend
// UI: collapsible bar above chat input (Input Bar Action entry point)
//
// Ported from bumyann/sillytavern-response-instructions
// Original: jQuery + STscript injection. Lumiverse: ctx.dom + ctx.ui placements.

export function setup(ctx) {

  // ─── State ─────────────────────────────────────────────────────────────────

  const ri = {
    text: '',
    enabled: false,
    open: false,
    presets: {},   // { name: text }
  };

  const wfm = {
    instruction: '',
    drafts: [],
    draftIndex: 0,
    open: false,
    loading: false,
    presets: {},
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const removeStyle = ctx.dom.addStyle(`
    /* ── Bar wrapper ── */
    .ri-bar {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0 8px;
      border-top: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      font-size: 13px;
    }

    /* ── Tab row ── */
    .ri-tab-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0;
      flex-wrap: wrap;
    }
    .ri-tab-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s;
      user-select: none;
    }
    .ri-tab-btn:hover {
      background: var(--lumiverse-fill-hover, var(--lumiverse-fill));
    }
    .ri-tab-btn.active {
      background: var(--lumiverse-accent-subtle, color-mix(in srgb, var(--lumiverse-accent) 18%, transparent));
      border-color: var(--lumiverse-accent);
      color: var(--lumiverse-accent);
    }
    .ri-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4caf50;
      display: none;
    }
    .ri-dot.visible { display: block; }

    /* ── Panels ── */
    .ri-panel, .wfm-panel {
      display: none;
      flex-direction: column;
      gap: 6px;
      padding: 6px 0 8px;
      border-top: 1px solid var(--lumiverse-border);
      animation: ri-slide-in 0.12s ease;
    }
    .ri-panel.open, .wfm-panel.open { display: flex; }

    @keyframes ri-slide-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Panel toolbar ── */
    .ri-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ri-toggle {
      padding: 2px 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .ri-toggle.on {
      background: color-mix(in srgb, var(--lumiverse-accent) 18%, transparent);
      border-color: var(--lumiverse-accent);
      color: var(--lumiverse-accent);
    }
    .ri-icon-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      font-size: 14px;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .ri-icon-btn:hover {
      background: var(--lumiverse-fill-hover, var(--lumiverse-fill));
      color: var(--lumiverse-text);
    }
    .ri-icon-btn.danger:hover { color: var(--lumiverse-danger, #e04040); }

    /* ── Textarea ── */
    .ri-textarea {
      width: 100%;
      min-height: 64px;
      max-height: 180px;
      resize: vertical;
      padding: 8px 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .ri-textarea:focus { border-color: var(--lumiverse-accent); }
    .ri-textarea::placeholder { color: var(--lumiverse-text-dim); }

    /* ── WFM draft area ── */
    .wfm-draft-area {
      position: relative;
    }
    .wfm-draft-nav {
      display: none;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }
    .wfm-draft-nav.visible { display: flex; }
    .wfm-draft-counter {
      font-size: 11px;
      color: var(--lumiverse-text-dim);
      min-width: 36px;
      text-align: center;
    }
    .wfm-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .wfm-btn {
      padding: 4px 14px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .wfm-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .wfm-btn.primary {
      background: var(--lumiverse-accent);
      border-color: var(--lumiverse-accent);
      color: #fff;
    }
    .wfm-btn.primary:hover:not(:disabled) {
      filter: brightness(1.1);
    }
    .wfm-loading-text {
      font-size: 12px;
      color: var(--lumiverse-text-dim);
      font-style: italic;
    }

    /* ── Preset modal ── */
    .ri-preset-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 320px;
      overflow-y: auto;
    }
    .ri-preset-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      cursor: pointer;
      transition: background 0.12s;
    }
    .ri-preset-item:hover { background: var(--lumiverse-fill-hover, var(--lumiverse-fill)); }
    .ri-preset-item-name {
      flex: 1;
      font-size: 13px;
      color: var(--lumiverse-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ri-preset-item-del {
      color: var(--lumiverse-text-dim);
      font-size: 14px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.12s;
    }
    .ri-preset-item-del:hover { color: var(--lumiverse-danger, #e04040); }
    .ri-preset-empty {
      color: var(--lumiverse-text-dim);
      font-size: 13px;
      text-align: center;
      padding: 16px 0;
    }
    .ri-preset-save-row {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .ri-preset-save-input {
      flex: 1;
      padding: 5px 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }
    .ri-preset-save-input:focus { border-color: var(--lumiverse-accent); }
  `);

  // ─── DOM injection ─────────────────────────────────────────────────────────
  // Lumiverse doesn't have a fixed "above chat input" slot yet; we mount
  // into a dock panel (bottom edge) so it's always visible above the input bar.
  // Users can collapse it. Falls back gracefully on mobile (bottom sheet).

  const panel = ctx.ui.requestDockPanel({
    edge: 'bottom',
    title: 'Response Instructions',
    size: 52,          // collapsed height — just the tab row
    minSize: 52,
    maxSize: 420,
    resizable: true,
    startCollapsed: false,
  });

  panel.root.innerHTML = `
    <div class="ri-bar">
      <div class="ri-tab-row">
        <button class="ri-tab-btn" id="ri-tab-instructions">
          <span class="ri-dot" id="ri-active-dot"></span>
          Instructions
        </button>
        <button class="ri-tab-btn" id="ri-tab-wfm">Write For Me</button>
      </div>

      <!-- Response Instructions panel -->
      <div class="ri-panel" id="ri-panel">
        <div class="ri-toolbar">
          <button class="ri-toggle" id="ri-toggle">OFF</button>
          <span style="flex:1"></span>
          <button class="ri-icon-btn" id="ri-presets-btn" title="Presets">📁</button>
          <button class="ri-icon-btn danger" id="ri-clear-btn" title="Clear">🗑</button>
        </div>
        <textarea class="ri-textarea" id="ri-textarea"
          placeholder="Steer the AI's next reply — no character limit. e.g. 'respond shyly and avoid eye contact'"></textarea>
      </div>

      <!-- Write For Me panel -->
      <div class="wfm-panel" id="wfm-panel">
        <div class="ri-toolbar">
          <span style="flex:1"></span>
          <button class="ri-icon-btn" id="wfm-presets-btn" title="Presets">📁</button>
        </div>
        <textarea class="ri-textarea" id="wfm-instruction"
          placeholder="Optional: steer how your message is written  e.g. 'act nervous and avoid eye contact'"></textarea>
        <div class="wfm-draft-area">
          <textarea class="ri-textarea" id="wfm-draft" placeholder="Draft appears here…" style="min-height:80px"></textarea>
          <div class="wfm-draft-nav" id="wfm-nav">
            <button class="ri-icon-btn" id="wfm-prev">‹</button>
            <span class="wfm-draft-counter" id="wfm-counter">1 / 1</span>
            <button class="ri-icon-btn" id="wfm-next">›</button>
          </div>
        </div>
        <div class="wfm-actions">
          <button class="wfm-btn primary" id="wfm-generate">Generate</button>
          <button class="wfm-btn" id="wfm-use" disabled>Use this</button>
          <span class="wfm-loading-text" id="wfm-loading" style="display:none">generating…</span>
        </div>
      </div>
    </div>
  `;

  // ─── Element refs ───────────────────────────────────────────────────────────

  const q = (sel) => panel.root.querySelector(sel);

  const riTab        = q('#ri-tab-instructions');
  const wfmTab       = q('#ri-tab-wfm');
  const riPanel      = q('#ri-panel');
  const wfmPanel     = q('#wfm-panel');
  const riActiveDot  = q('#ri-active-dot');
  const riToggle     = q('#ri-toggle');
  const riTextarea   = q('#ri-textarea');
  const riClearBtn   = q('#ri-clear-btn');
  const riPresetsBtn = q('#ri-presets-btn');

  const wfmInstruction = q('#wfm-instruction');
  const wfmDraft       = q('#wfm-draft');
  const wfmNav         = q('#wfm-nav');
  const wfmCounter     = q('#wfm-counter');
  const wfmPrev        = q('#wfm-prev');
  const wfmNext        = q('#wfm-next');
  const wfmGenerate    = q('#wfm-generate');
  const wfmUse         = q('#wfm-use');
  const wfmLoading     = q('#wfm-loading');
  const wfmPresetsBtn  = q('#wfm-presets-btn');

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function syncRiToBackend() {
    ctx.sendToBackend({
      type: 'set_instruction',
      text: ri.text,
      enabled: ri.enabled,
    });
  }

  function updateRiUI() {
    riActiveDot.classList.toggle('visible', ri.enabled);
    riToggle.textContent = ri.enabled ? 'ON' : 'OFF';
    riToggle.classList.toggle('on', ri.enabled);
    riTab.classList.toggle('active', ri.open || ri.enabled);
  }

  function updateWfmDraftUI() {
    const hasDrafts = wfm.drafts.length > 0;
    wfmNav.classList.toggle('visible', wfm.drafts.length > 1);
    wfmUse.disabled = !hasDrafts;
    if (hasDrafts) {
      wfmDraft.value = wfm.drafts[wfm.draftIndex] ?? '';
      wfmCounter.textContent = `${wfm.draftIndex + 1} / ${wfm.drafts.length}`;
    }
  }

  function setWfmLoading(loading) {
    wfm.loading = loading;
    wfmGenerate.disabled = loading;
    wfmLoading.style.display = loading ? 'inline' : 'none';
  }

  function openRiPanel() {
    ri.open = true;
    wfm.open = false;
    riPanel.classList.add('open');
    wfmPanel.classList.remove('open');
    riTab.classList.add('active');
    wfmTab.classList.remove('active');
    // Expand dock to show content
    panel.expand();
    adjustPanelSize();
  }

  function openWfmPanel() {
    wfm.open = true;
    ri.open = false;
    wfmPanel.classList.add('open');
    riPanel.classList.remove('open');
    wfmTab.classList.add('active');
    riTab.classList.remove('active');
    panel.expand();
    adjustPanelSize();
  }

  function closeAll() {
    ri.open = false;
    wfm.open = false;
    riPanel.classList.remove('open');
    wfmPanel.classList.remove('open');
    riTab.classList.toggle('active', ri.enabled);
    wfmTab.classList.remove('active');
    panel.collapse();
  }

  function adjustPanelSize() {
    // Auto-size based on which panel is open
    if (ri.open) {
      panel.expand();
    } else if (wfm.open) {
      panel.expand();
    }
  }

  // ─── Tab clicks ─────────────────────────────────────────────────────────────

  riTab.addEventListener('click', () => {
    if (ri.open) closeAll(); else openRiPanel();
  });

  wfmTab.addEventListener('click', () => {
    if (wfm.open) closeAll(); else openWfmPanel();
  });

  // ─── RI: toggle ─────────────────────────────────────────────────────────────

  riToggle.addEventListener('click', () => {
    ri.enabled = !ri.enabled;
    updateRiUI();
    syncRiToBackend();
  });

  // ─── RI: textarea ───────────────────────────────────────────────────────────

  riTextarea.addEventListener('input', () => {
    ri.text = riTextarea.value;
    syncRiToBackend();
  });

  // ─── RI: clear ──────────────────────────────────────────────────────────────

  riClearBtn.addEventListener('click', () => {
    ri.text = '';
    ri.enabled = false;
    riTextarea.value = '';
    updateRiUI();
    syncRiToBackend();
  });

  // ─── RI: presets ────────────────────────────────────────────────────────────

  riPresetsBtn.addEventListener('click', () => openPresetModal('ri'));
  wfmPresetsBtn.addEventListener('click', () => openPresetModal('wfm'));

  async function openPresetModal(store) {
    // Load presets first
    ctx.sendToBackend({ type: 'load_presets', store });
    // Modal is shown when presets_loaded comes back
    pendingModalStore = store;
  }

  let pendingModalStore = null;

  function showPresetModal(store, presets) {
    const isRi = store === 'ri';
    const currentText = isRi ? ri.text : wfmInstruction.value;

    const modal = ctx.ui.showModal({
      title: isRi ? 'Response Instruction Presets' : 'Write For Me Presets',
      width: 460,
      maxHeight: 540,
    });

    function renderModal() {
      const names = Object.keys(presets);
      modal.root.innerHTML = `
        <div class="ri-preset-list" id="preset-list">
          ${names.length === 0
            ? '<div class="ri-preset-empty">No presets saved yet.</div>'
            : names.map(name => `
              <div class="ri-preset-item" data-name="${escHtml(name)}">
                <span class="ri-preset-item-name">${escHtml(name)}</span>
                <span class="ri-preset-item-del" data-del="${escHtml(name)}">✕</span>
              </div>
            `).join('')}
        </div>
        <div class="ri-preset-save-row">
          <input class="ri-preset-save-input" id="preset-name-input" placeholder="Preset name…" />
          <button class="wfm-btn primary" id="preset-save-btn">Save current</button>
        </div>
      `;

      // Load preset on click
      modal.root.querySelectorAll('.ri-preset-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.hasAttribute('data-del')) return; // handled separately
          const name = item.dataset.name;
          const text = presets[name] ?? '';
          if (isRi) {
            ri.text = text;
            riTextarea.value = text;
            syncRiToBackend();
          } else {
            wfmInstruction.value = text;
          }
          modal.dismiss();
        });
      });

      // Delete preset
      modal.root.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.dataset.del;
          ctx.sendToBackend({ type: 'delete_preset', store, name });
          delete presets[name];
          renderModal();
        });
      });

      // Save current as preset
      const saveBtn = modal.root.querySelector('#preset-save-btn');
      const nameInput = modal.root.querySelector('#preset-name-input');
      saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return;
        ctx.sendToBackend({ type: 'save_preset', store, name, text: currentText });
        presets[name] = currentText;
        nameInput.value = '';
        renderModal();
      });
    }

    renderModal();
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Write For Me ────────────────────────────────────────────────────────────

  wfmGenerate.addEventListener('click', () => {
    if (wfm.loading) return;
    setWfmLoading(true);

    const requestId = Math.random().toString(36).slice(2);

    ctx.sendToBackend({
      type: 'generate_wfm',
      instruction: wfmInstruction.value.trim(),
      requestId,
      // We don't have direct chat history access in frontend,
      // so the backend uses the active connection's context.
      // If Lumiverse exposes a chat history ctx API in future,
      // pass it here as chatContext[].
    });

    pendingWfmId = requestId;
  });

  let pendingWfmId = null;

  wfmPrev.addEventListener('click', () => {
    if (wfm.draftIndex > 0) {
      wfm.draftIndex--;
      updateWfmDraftUI();
    }
  });

  wfmNext.addEventListener('click', () => {
    if (wfm.draftIndex < wfm.drafts.length - 1) {
      wfm.draftIndex++;
      updateWfmDraftUI();
    }
  });

  wfmDraft.addEventListener('input', () => {
    if (wfm.drafts.length > 0) {
      wfm.drafts[wfm.draftIndex] = wfmDraft.value;
    }
  });

  wfmUse.addEventListener('click', () => {
    const text = wfmDraft.value;
    if (!text) return;
    // Push text into the chat input via UI automation
    // Lumiverse doesn't expose a direct setInput API in frontend ctx,
    // so we use document querySelector on the host chat input
    const chatInput = document.querySelector('textarea[data-testid="chat-input"], .chat-input textarea, #chat-input');
    if (chatInput) {
      chatInput.value = text;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      chatInput.focus();
    } else {
      // Fallback: copy to clipboard with a toast-like notice
      navigator.clipboard.writeText(text).catch(() => {});
    }
  });

  // ─── Backend message handler ─────────────────────────────────────────────────

  const unsub = ctx.onBackendMessage((payload) => {
    // Preset loaded → show modal
    if (payload.type === 'presets_loaded' && payload.store === pendingModalStore) {
      const store = payload.store;
      if (store === 'ri') ri.presets = payload.data;
      else wfm.presets = payload.data;
      showPresetModal(store, payload.data);
      pendingModalStore = null;
      return;
    }

    // WFM result
    if (payload.type === 'wfm_result' && payload.requestId === pendingWfmId) {
      setWfmLoading(false);
      wfm.drafts.push(payload.text);
      wfm.draftIndex = wfm.drafts.length - 1;
      updateWfmDraftUI();
      pendingWfmId = null;
      return;
    }

    // WFM error
    if (payload.type === 'wfm_error' && payload.requestId === pendingWfmId) {
      setWfmLoading(false);
      wfmDraft.value = `[Error: ${payload.error}]`;
      pendingWfmId = null;
      return;
    }
  });

  // ─── Initial load ────────────────────────────────────────────────────────────

  // Restore presets from backend storage on load
  ctx.sendToBackend({ type: 'load_presets', store: 'ri' });
  ctx.sendToBackend({ type: 'load_presets', store: 'wfm' });

  ctx.onBackendMessage((payload) => {
    if (payload.type === 'presets_loaded') {
      if (payload.store === 'ri') ri.presets = payload.data;
      else wfm.presets = payload.data;
    }
  });

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  return () => {
    unsub();
    removeStyle();
    ctx.dom.cleanup();
    panel.destroy();
  };
}
