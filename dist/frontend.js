// Response Instructions + Write For Me — Lumiverse Spindle Frontend v1.0.0
//
// ✦ button: draggable anywhere, position saved to localStorage
//   right-click (desktop) / long-press (mobile) → customization popup
//   tap → full-width panel slides up above chat input bar
//
// Panel: two tabs — Instructions (interceptor inject) + Write For Me (AI draft)

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
  let panelOpen = false;

  // ─── Persisted button settings (localStorage) ────────────────────────────────

  const STORE_KEY = 'ri_btn_settings';

  function loadBtnSettings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
  }
  function saveBtnSettings(patch) {
    const s = { ...loadBtnSettings(), ...patch };
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
    return s;
  }

  let btnSettings = loadBtnSettings();
  // defaults
  if (!btnSettings.color) btnSettings.color = '';       // empty = use accent
  if (!btnSettings.image) btnSettings.image = '';       // base64 data URL or ''
  if (btnSettings.x == null) btnSettings.x = null;     // null = use default position
  if (btnSettings.y == null) btnSettings.y = null;

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* ── Float button ── */
    #ri-float-btn {
      position: fixed;
      z-index: 9998;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--ri-btn-bg, var(--lumiverse-accent, #6c63ff));
      border: 2.5px solid color-mix(in srgb, var(--ri-btn-bg, var(--lumiverse-accent, #6c63ff)) 55%, white);
      box-shadow: 0 3px 14px rgba(0,0,0,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      user-select: none;
      touch-action: none;
      overflow: hidden;
      transition: box-shadow 0.15s, transform 0.12s;
    }
    #ri-float-btn:hover { transform: scale(1.06); }
    #ri-float-btn.panel-open {
      box-shadow: 0 3px 14px rgba(0,0,0,0.4),
                  0 0 0 3px color-mix(in srgb, var(--ri-btn-bg, var(--lumiverse-accent, #6c63ff)) 40%, transparent);
    }
    #ri-float-btn .ri-btn-label {
      position: relative;
      z-index: 1;
      pointer-events: none;
    }
    #ri-float-btn img.ri-btn-img {
      position: absolute;
      inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      border-radius: 50%;
      pointer-events: none;
    }
    #ri-float-btn .ri-btn-dot {
      position: absolute;
      top: 2px; right: 2px;
      width: 9px; height: 9px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #111;
      display: none;
      z-index: 2;
    }
    #ri-float-btn .ri-btn-dot.on { display: block; }

    /* ── Slide-up panel ── */
    #ri-panel-wrap {
      position: fixed;
      z-index: 9997;
      left: 0; right: 0;
      background: var(--lumiverse-bg, #1a1a2e);
      border-top: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      box-shadow: 0 -4px 24px rgba(0,0,0,0.35);
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
      font-size: 13px;
      color: var(--lumiverse-text, #e0e0f0);
      font-family: inherit;
    }
    #ri-panel-wrap.open { transform: translateY(0); }

    /* inner tabs */
    #ri-inner-tabs {
      display: flex;
      border-bottom: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      flex-shrink: 0;
    }
    .ri-inner-tab {
      flex: 1; padding: 7px 8px;
      background: none; border: none;
      border-bottom: 2px solid transparent;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      cursor: pointer; font-size: 12px; font-weight: 500; font-family: inherit;
      transition: all 0.12s; display: flex; align-items: center; justify-content: center; gap: 5px;
    }
    .ri-inner-tab:hover { color: var(--lumiverse-text, #e0e0f0); }
    .ri-inner-tab.active {
      color: var(--lumiverse-accent, #6c63ff);
      border-bottom-color: var(--lumiverse-accent, #6c63ff);
    }
    .ri-on-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #4caf50; display: none; flex-shrink: 0;
    }
    .ri-on-dot.on { display: block; }

    /* sub-panels */
    .ri-sub-panel { display: none; flex-direction: column; gap: 8px; padding: 10px 12px; }
    .ri-sub-panel.active { display: flex; }

    .ri-toolbar { display: flex; align-items: center; gap: 6px; }
    .ri-toggle {
      padding: 3px 12px; border-radius: 6px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      cursor: pointer; font-size: 11px; font-weight: 600; font-family: inherit;
      letter-spacing: 0.04em; transition: all 0.12s;
    }
    .ri-toggle.on {
      background: color-mix(in srgb, var(--lumiverse-accent, #6c63ff) 18%, transparent);
      border-color: var(--lumiverse-accent, #6c63ff);
      color: var(--lumiverse-accent, #6c63ff);
    }
    .ri-spacer { flex: 1; }
    .ri-icon-btn {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.05));
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      cursor: pointer; font-size: 13px; padding: 0; transition: all 0.12s; flex-shrink: 0;
    }
    .ri-icon-btn:hover {
      background: var(--lumiverse-fill-hover, rgba(255,255,255,0.1));
      color: var(--lumiverse-text, #e0e0f0);
    }
    .ri-icon-btn.danger:hover { color: #e05050; }

    .ri-textarea {
      width: 100%; min-height: 64px; max-height: 140px; resize: vertical;
      padding: 8px 10px; border-radius: 8px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.05));
      color: var(--lumiverse-text, #e0e0f0); font-size: 13px; font-family: inherit;
      outline: none; box-sizing: border-box; transition: border-color 0.12s;
    }
    .ri-textarea:focus { border-color: var(--lumiverse-accent, #6c63ff); }
    .ri-textarea::placeholder { color: var(--lumiverse-text-dim, rgba(255,255,255,0.3)); }

    .wfm-nav { display: none; align-items: center; gap: 4px; }
    .wfm-nav.visible { display: flex; }
    .wfm-counter {
      font-size: 11px; color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      min-width: 36px; text-align: center;
    }
    .wfm-actions { display: flex; gap: 6px; align-items: center; }
    .wfm-btn {
      padding: 5px 14px; border-radius: 7px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text, #e0e0f0); cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.12s;
    }
    .wfm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .wfm-btn.primary {
      background: var(--lumiverse-accent, #6c63ff); border-color: var(--lumiverse-accent, #6c63ff); color: #fff;
    }
    .wfm-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
    .wfm-loading { font-size: 11px; color: var(--lumiverse-text-dim, rgba(255,255,255,0.4)); font-style: italic; display: none; }
    .wfm-loading.visible { display: inline; }

    /* ── Customization popup ── */
    #ri-custom-popup {
      position: fixed;
      z-index: 10000;
      background: var(--lumiverse-bg, #1a1a2e);
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.14));
      border-radius: 10px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.5);
      padding: 12px;
      display: none;
      flex-direction: column;
      gap: 10px;
      width: 220px;
      font-size: 12px;
      color: var(--lumiverse-text, #e0e0f0);
      font-family: inherit;
    }
    #ri-custom-popup.open { display: flex; }
    .ri-custom-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.4));
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .ri-custom-section { display: flex; flex-direction: column; gap: 5px; }
    .ri-color-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .ri-color-swatch {
      width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; transition: border-color 0.12s; flex-shrink: 0;
    }
    .ri-color-swatch:hover, .ri-color-swatch.active { border-color: #fff; }
    .ri-color-swatch.accent {
      background: var(--lumiverse-accent, #6c63ff);
    }
    #ri-color-input {
      width: 28px; height: 28px; border-radius: 50%;
      border: 2px solid var(--lumiverse-border, rgba(255,255,255,0.15));
      padding: 0; cursor: pointer; background: none; flex-shrink: 0;
      -webkit-appearance: none; appearance: none; overflow: hidden;
    }
    #ri-color-input::-webkit-color-swatch-wrapper { padding: 0; }
    #ri-color-input::-webkit-color-swatch { border: none; border-radius: 50%; }
    .ri-upload-btn {
      padding: 4px 10px; border-radius: 6px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text, #e0e0f0); cursor: pointer; font-size: 11px; font-family: inherit;
      transition: background 0.12s; text-align: center;
    }
    .ri-upload-btn:hover { background: var(--lumiverse-fill-hover, rgba(255,255,255,0.1)); }
    .ri-remove-img {
      padding: 4px 10px; border-radius: 6px;
      border: 1px solid rgba(224,80,80,0.3);
      background: rgba(224,80,80,0.08);
      color: #e05050; cursor: pointer; font-size: 11px; font-family: inherit;
      display: none; transition: background 0.12s;
    }
    .ri-remove-img.visible { display: block; }
    .ri-remove-img:hover { background: rgba(224,80,80,0.16); }
    .ri-custom-divider {
      height: 1px; background: var(--lumiverse-border, rgba(255,255,255,0.1)); margin: 0 -2px;
    }
    .ri-reset-btn {
      padding: 4px 10px; border-radius: 6px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.12));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text-dim, rgba(255,255,255,0.45)); cursor: pointer;
      font-size: 11px; font-family: inherit; transition: all 0.12s; text-align: center;
    }
    .ri-reset-btn:hover { color: var(--lumiverse-text, #e0e0f0); }

    /* ── Preset modal ── */
    .ri-preset-list { display: flex; flex-direction: column; gap: 5px; max-height: 260px; overflow-y: auto; margin-bottom: 8px; }
    .ri-preset-row {
      display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.05)); cursor: pointer; transition: background 0.1s;
    }
    .ri-preset-row:hover { background: var(--lumiverse-fill-hover, rgba(255,255,255,0.09)); }
    .ri-preset-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ri-preset-del { font-size: 13px; color: var(--lumiverse-text-dim, rgba(255,255,255,0.35)); cursor: pointer; padding: 2px 4px; border-radius: 4px; transition: color 0.1s; flex-shrink: 0; }
    .ri-preset-del:hover { color: #e05050; }
    .ri-preset-empty { text-align: center; color: var(--lumiverse-text-dim, rgba(255,255,255,0.35)); font-size: 13px; padding: 14px 0; }
    .ri-preset-save-row { display: flex; gap: 6px; }
    .ri-preset-input {
      flex: 1; padding: 5px 10px; border-radius: 7px;
      border: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      background: var(--lumiverse-fill, rgba(255,255,255,0.06));
      color: var(--lumiverse-text, #e0e0f0); font-size: 13px; font-family: inherit; outline: none;
    }
    .ri-preset-input:focus { border-color: var(--lumiverse-accent, #6c63ff); }
  `;
  document.head.appendChild(styleEl);

  // ─── Float button ─────────────────────────────────────────────────────────────

  const btn = document.createElement('div');
  btn.id = 'ri-float-btn';
  btn.title = 'Response Instructions (right-click to customize)';
  btn.innerHTML = `<span class="ri-btn-label">✦</span><span class="ri-btn-dot" id="ri-btn-dot"></span>`;
  document.body.appendChild(btn);

  const btnDot    = btn.querySelector('#ri-btn-dot');
  const btnLabel  = btn.querySelector('.ri-btn-label');

  // apply saved settings to button
  function applyBtnSettings() {
    const { color, image, x, y } = btnSettings;
    btn.style.setProperty('--ri-btn-bg', color || '');
    // image
    const existing = btn.querySelector('img.ri-btn-img');
    if (existing) existing.remove();
    if (image) {
      const img = document.createElement('img');
      img.className = 'ri-btn-img';
      img.src = image;
      btn.appendChild(img);
      btnLabel.style.display = 'none';
    } else {
      btnLabel.style.display = '';
    }
    // position
    if (x != null && y != null) {
      btn.style.left   = Math.max(0, Math.min(window.innerWidth  - 48, x)) + 'px';
      btn.style.top    = Math.max(0, Math.min(window.innerHeight - 48, y)) + 'px';
      btn.style.bottom = ''; btn.style.right = '';
    } else {
      // default: above chat bar, left side
      const bar = findChatBar();
      const barH = bar ? bar.getBoundingClientRect().height : 56;
      btn.style.bottom = (barH + 10) + 'px';
      btn.style.left   = '12px';
      btn.style.top    = ''; btn.style.right = '';
    }
  }
  applyBtnSettings();

  function findChatBar() {
    return document.querySelector(
      '.lumi-input-bar, .chat-input-bar, [data-testid="chat-input-bar"], ' +
      '[data-testid="chat-input"], .input-bar, footer.chat-footer, ' +
      '.message-input-wrapper, .chat-footer'
    );
  }

  function positionPanel() {
    const bar = findChatBar();
    const barH = bar ? bar.getBoundingClientRect().height : 56;
    panel.style.bottom = barH + 'px';
  }

  window.addEventListener('resize', () => {
    positionPanel();
    if (btnSettings.x == null) applyBtnSettings(); // re-snap default pos on resize
  });

  // ─── Drag ────────────────────────────────────────────────────────────────────

  let dragging = false, didDrag = false, dragOffX = 0, dragOffY = 0;

  btn.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return; // right-click handled separately
    dragging = true; didDrag = false;
    const r = btn.getBoundingClientRect();
    dragOffX = e.clientX - r.left; dragOffY = e.clientY - r.top;
    btn.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  btn.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 3) didDrag = true;
    const newX = Math.max(0, Math.min(window.innerWidth  - 48, e.clientX - dragOffX));
    const newY = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffY));
    btn.style.left = newX + 'px'; btn.style.top = newY + 'px';
    btn.style.bottom = ''; btn.style.right = '';
  });

  btn.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    if (didDrag) {
      // save position
      const r = btn.getBoundingClientRect();
      btnSettings = saveBtnSettings({ x: r.left, y: r.top });
      return;
    }
    // tap — toggle panel
    closeCustomPopup();
    togglePanel();
  });

  // ─── Panel ───────────────────────────────────────────────────────────────────

  const panel = document.createElement('div');
  panel.id = 'ri-panel-wrap';
  panel.innerHTML = `
    <div id="ri-inner-tabs">
      <button class="ri-inner-tab active" data-tab="ri">
        <span class="ri-on-dot" id="ri-on-dot"></span>
        Instructions
      </button>
      <button class="ri-inner-tab" data-tab="wfm">Write For Me</button>
    </div>

    <div class="ri-sub-panel active" id="ri-sub-ri">
      <div class="ri-toolbar">
        <button class="ri-toggle" id="ri-toggle">OFF</button>
        <span class="ri-spacer"></span>
        <button class="ri-icon-btn" id="ri-presets-btn" title="Presets">📁</button>
        <button class="ri-icon-btn danger" id="ri-clear-btn" title="Clear">🗑</button>
      </div>
      <textarea class="ri-textarea" id="ri-textarea"
        placeholder="Steer the AI's next reply — no character limit.&#10;e.g. 'respond shyly and avoid eye contact'"></textarea>
    </div>

    <div class="ri-sub-panel" id="ri-sub-wfm">
      <div class="ri-toolbar">
        <span class="ri-spacer"></span>
        <button class="ri-icon-btn" id="wfm-presets-btn" title="Presets">📁</button>
      </div>
      <textarea class="ri-textarea" id="wfm-instruction"
        placeholder="Optional: how to write it — e.g. 'act nervous, avoid eye contact'"></textarea>
      <textarea class="ri-textarea" id="wfm-draft"
        placeholder="Draft appears here…" style="min-height:72px"></textarea>
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
  `;
  document.body.appendChild(panel);
  positionPanel();

  function togglePanel() {
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    btn.classList.toggle('panel-open', panelOpen);
  }

  panel.querySelectorAll('.ri-inner-tab').forEach(t => {
    t.addEventListener('click', () => {
      panel.querySelectorAll('.ri-inner-tab').forEach(x => x.classList.remove('active'));
      panel.querySelectorAll('.ri-sub-panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      panel.querySelector(t.dataset.tab === 'ri' ? '#ri-sub-ri' : '#ri-sub-wfm').classList.add('active');
    });
  });

  // close panel on outside tap
  document.addEventListener('pointerdown', (e) => {
    if (panelOpen && !panel.contains(e.target) && !btn.contains(e.target)) {
      panelOpen = false;
      panel.classList.remove('open');
      btn.classList.remove('panel-open');
    }
    if (customPopupOpen && !customPopup.contains(e.target) && !btn.contains(e.target)) {
      closeCustomPopup();
    }
  }, true);

  // ─── Customization popup ──────────────────────────────────────────────────────

  const PRESET_COLORS = ['#6c63ff', '#e05c8a', '#3eb489', '#f0a500', '#4db8ff', '#b06bff'];

  const customPopup = document.createElement('div');
  customPopup.id = 'ri-custom-popup';
  customPopup.innerHTML = `
    <div class="ri-custom-section">
      <div class="ri-custom-label">Button Color</div>
      <div class="ri-color-row" id="ri-swatch-row">
        <div class="ri-color-swatch accent" data-color="" title="Theme accent"></div>
        ${PRESET_COLORS.map(c => `<div class="ri-color-swatch" data-color="${c}" style="background:${c}" title="${c}"></div>`).join('')}
        <input type="color" id="ri-color-input" title="Custom color" />
      </div>
    </div>
    <div class="ri-custom-divider"></div>
    <div class="ri-custom-section">
      <div class="ri-custom-label">Button Image</div>
      <label class="ri-upload-btn" id="ri-upload-label">
        📁 Upload image
        <input type="file" id="ri-img-upload" accept="image/*" style="display:none" />
      </label>
      <div class="ri-remove-img" id="ri-remove-img">✕ Remove image</div>
    </div>
    <div class="ri-custom-divider"></div>
    <div class="ri-reset-btn" id="ri-reset-pos">↺ Reset position</div>
  `;
  document.body.appendChild(customPopup);

  let customPopupOpen = false;

  function openCustomPopup(x, y) {
    customPopupOpen = true;
    customPopup.classList.add('open');
    // mark active swatch
    customPopup.querySelectorAll('.ri-color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === (btnSettings.color || ''));
    });
    customPopup.querySelector('#ri-remove-img').classList.toggle('visible', !!btnSettings.image);
    // position popup near the button, clamped to viewport
    customPopup.style.left = '0'; customPopup.style.top = '0'; // temp measure
    const pw = 220, ph = 200;
    const cx = Math.max(8, Math.min(window.innerWidth - pw - 8, x));
    const cy = Math.max(8, Math.min(window.innerHeight - ph - 8, y - ph - 8));
    customPopup.style.left = cx + 'px';
    customPopup.style.top  = cy + 'px';
    if (panelOpen) togglePanel(); // close panel if open
  }

  function closeCustomPopup() {
    customPopupOpen = false;
    customPopup.classList.remove('open');
  }

  // right-click
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openCustomPopup(e.clientX, e.clientY);
  });

  // long-press (mobile)
  let longPressTimer = null;
  btn.addEventListener('touchstart', (e) => {
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      didDrag = true; // prevent tap from firing
      const t = e.touches[0];
      openCustomPopup(t.clientX, t.clientY);
      navigator.vibrate?.(40);
    }, 500);
  }, { passive: true });
  btn.addEventListener('touchend', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
  btn.addEventListener('touchmove', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });

  // swatch clicks
  customPopup.querySelectorAll('.ri-color-swatch').forEach(s => {
    s.addEventListener('click', () => {
      btnSettings = saveBtnSettings({ color: s.dataset.color });
      applyBtnSettings();
      customPopup.querySelectorAll('.ri-color-swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
    });
  });

  // custom color picker
  const colorInput = customPopup.querySelector('#ri-color-input');
  colorInput.value = btnSettings.color || '#6c63ff';
  colorInput.addEventListener('input', () => {
    btnSettings = saveBtnSettings({ color: colorInput.value });
    applyBtnSettings();
    customPopup.querySelectorAll('.ri-color-swatch').forEach(s => s.classList.remove('active'));
  });

  // image upload
  const imgUpload = customPopup.querySelector('#ri-img-upload');
  imgUpload.addEventListener('change', () => {
    const file = imgUpload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      btnSettings = saveBtnSettings({ image: e.target.result });
      applyBtnSettings();
      customPopup.querySelector('#ri-remove-img').classList.add('visible');
    };
    reader.readAsDataURL(file);
    imgUpload.value = '';
  });

  // remove image
  customPopup.querySelector('#ri-remove-img').addEventListener('click', () => {
    btnSettings = saveBtnSettings({ image: '' });
    applyBtnSettings();
    customPopup.querySelector('#ri-remove-img').classList.remove('visible');
  });

  // reset position
  customPopup.querySelector('#ri-reset-pos').addEventListener('click', () => {
    btnSettings = saveBtnSettings({ x: null, y: null });
    applyBtnSettings();
    closeCustomPopup();
  });

  // ─── Element refs ─────────────────────────────────────────────────────────────

  const q = (sel) => panel.querySelector(sel);
  const riOnDot      = q('#ri-on-dot');
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
  const wfmLoadingEl   = q('#wfm-loading');
  const wfmPresetsBtn  = q('#wfm-presets-btn');

  // ─── RI ──────────────────────────────────────────────────────────────────────

  function syncRI() {
    ctx.sendToBackend({ type: 'ri:set', text: riText, enabled: riEnabled });
    riOnDot.classList.toggle('on', riEnabled);
    btnDot.classList.toggle('on', riEnabled);
    riToggle.textContent = riEnabled ? 'ON' : 'OFF';
    riToggle.classList.toggle('on', riEnabled);
  }

  riToggle.addEventListener('click', () => { riEnabled = !riEnabled; syncRI(); });
  riTextarea.addEventListener('input', () => { riText = riTextarea.value; syncRI(); });
  riClearBtn.addEventListener('click', () => { riText = ''; riEnabled = false; riTextarea.value = ''; syncRI(); });

  // ─── WFM ─────────────────────────────────────────────────────────────────────

  function updateWfmUI() {
    const has = wfmDrafts.length > 0;
    wfmUse.disabled = !has;
    wfmNav.classList.toggle('visible', wfmDrafts.length > 1);
    if (has) { wfmDraft.value = wfmDrafts[wfmDraftIdx]; wfmCounter.textContent = `${wfmDraftIdx + 1} / ${wfmDrafts.length}`; }
  }

  wfmGenerate.addEventListener('click', () => {
    if (wfmLoading) return;
    wfmLoading = true; wfmGenerate.disabled = true; wfmLoadingEl.classList.add('visible');
    wfmPendingId = Math.random().toString(36).slice(2);
    ctx.sendToBackend({ type: 'wfm:generate', instruction: wfmInstruction.value.trim(), requestId: wfmPendingId });
  });
  wfmPrev.addEventListener('click', () => { if (wfmDraftIdx > 0) { wfmDraftIdx--; updateWfmUI(); } });
  wfmNext.addEventListener('click', () => { if (wfmDraftIdx < wfmDrafts.length - 1) { wfmDraftIdx++; updateWfmUI(); } });
  wfmDraft.addEventListener('input', () => { if (wfmDrafts.length > 0) wfmDrafts[wfmDraftIdx] = wfmDraft.value; });

  wfmUse.addEventListener('click', () => {
    const text = wfmDraft.value.trim();
    if (!text) return;
    const inp = document.querySelector(
      '[data-testid="chat-input"] textarea, textarea.chat-input, #chat-input textarea, .lumi-chat-input textarea, .message-input textarea'
    );
    if (inp) { inp.value = text; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus(); }
    else { navigator.clipboard?.writeText(text).catch(() => {}); }
    togglePanel();
  });

  // ─── Presets ──────────────────────────────────────────────────────────────────

  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

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
          ${names.length === 0 ? '<div class="ri-preset-empty">No presets yet.</div>'
            : names.map(n => `<div class="ri-preset-row" data-name="${esc(n)}"><span class="ri-preset-name">${esc(n)}</span><span class="ri-preset-del" data-del="${esc(n)}">✕</span></div>`).join('')}
        </div>
        <div class="ri-preset-save-row">
          <input class="ri-preset-input" id="pm-name" placeholder="Preset name…" />
          <button class="wfm-btn primary" id="pm-save">Save current</button>
        </div>`;
      modal.root.querySelectorAll('.ri-preset-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.dataset.del) return;
          const text = presets[row.dataset.name] ?? '';
          if (isRi) { riText = text; riTextarea.value = text; syncRI(); } else { wfmInstruction.value = text; }
          modal.dismiss();
        });
      });
      modal.root.querySelectorAll('[data-del]').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          ctx.sendToBackend({ type: 'preset:delete', store, name: b.dataset.del });
          delete presets[b.dataset.del]; render();
        });
      });
      modal.root.querySelector('#pm-save').addEventListener('click', () => {
        const name = modal.root.querySelector('#pm-name').value.trim();
        if (!name) return;
        ctx.sendToBackend({ type: 'preset:save', store, name, text: currentText });
        presets[name] = currentText; modal.root.querySelector('#pm-name').value = ''; render();
      });
    }
    render();
  }

  // ─── Backend messages ─────────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === 'preset:data') {
      if (payload.store === 'ri') riPresets = payload.data; else wfmPresets = payload.data;
      if (pendingPresetStore === payload.store) {
        pendingPresetStore = null;
        showPresetModal(payload.store, payload.store === 'ri' ? riPresets : wfmPresets);
      }
      return;
    }
    if (payload.type === 'wfm:result' && payload.requestId === wfmPendingId) {
      wfmLoading = false; wfmGenerate.disabled = false; wfmLoadingEl.classList.remove('visible');
      wfmDrafts.push(payload.text); wfmDraftIdx = wfmDrafts.length - 1; updateWfmUI(); wfmPendingId = null;
      return;
    }
    if (payload.type === 'wfm:error' && payload.requestId === wfmPendingId) {
      wfmLoading = false; wfmGenerate.disabled = false; wfmLoadingEl.classList.remove('visible');
      wfmDraft.value = `Error: ${payload.error}`; wfmPendingId = null;
      return;
    }
  });

  ctx.sendToBackend({ type: 'preset:load', store: 'ri' });
  ctx.sendToBackend({ type: 'preset:load', store: 'wfm' });

  // ─── Cleanup ──────────────────────────────────────────────────────────────────

  return () => {
    unsubBackend();
    btn.remove(); panel.remove(); customPopup.remove(); styleEl.remove();
    window.removeEventListener('resize', positionPanel);
  };
}
