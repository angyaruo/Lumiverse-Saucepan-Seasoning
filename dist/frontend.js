// Response Instructions + Write For Me — Lumiverse Spindle Frontend v1.0.0
//
// Panel is injected as a DOM sibling directly before [data-component="InputArea"],
// so it sits naturally between chat and input — same width, no overlap, no JS positioning.
//
// ✦ button: draggable anywhere, right-click/long-press → customize

export function setup(ctx) {

  let riText = '', riEnabled = false, riPresets = {}, wfmPresets = {};
  let wfmDrafts = [], wfmDraftIdx = 0, wfmLoading = false, wfmPendingId = null;
  let pendingPresetStore = null, panelOpen = false, customOpen = false;

  // ─── Button settings ──────────────────────────────────────────────────────────
  const SK = 'ri_btn_v1';
  function loadCfg() { try { return JSON.parse(localStorage.getItem(SK)||'{}'); } catch { return {}; } }
  function saveCfg(p) { const s={...loadCfg(),...p}; localStorage.setItem(SK,JSON.stringify(s)); return s; }
  let C = loadCfg();
  if (!C.color) C.color=''; if (!C.image) C.image=''; if (C.x==null) C.x=null; if (C.y==null) C.y=null;

  // ─── Styles ───────────────────────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #ri-strip {
      display: none; flex-direction: column;
      background: var(--lumiverse-surface, var(--lumiverse-bg, #1a1a2e));
      border-top: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      border-bottom: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1));
      font-size: 13px; color: var(--lumiverse-text, #e0e0f0); font-family: inherit;
    }
    #ri-strip.open { display: flex; }
    #ri-strip-tabs { display: flex; border-bottom: 1px solid var(--lumiverse-border, rgba(255,255,255,0.1)); }
    .ri-stab {
      flex:1; padding:7px 8px; background:none; border:none; border-bottom:2px solid transparent;
      color:var(--lumiverse-text-dim,rgba(255,255,255,0.4)); cursor:pointer; font-size:12px; font-weight:500;
      font-family:inherit; transition:all 0.12s; display:flex; align-items:center; justify-content:center; gap:5px;
    }
    .ri-stab:hover { color:var(--lumiverse-text,#e0e0f0); }
    .ri-stab.active { color:var(--lumiverse-accent,#6c63ff); border-bottom-color:var(--lumiverse-accent,#6c63ff); }
    #ri-strip-close {
      background:none; border:none; color:var(--lumiverse-text-dim,rgba(255,255,255,0.4));
      cursor:pointer; font-size:15px; padding:0 12px; flex-shrink:0; transition:color 0.12s;
    }
    #ri-strip-close:hover { color:var(--lumiverse-text,#e0e0f0); }
    .ri-on-dot { width:6px; height:6px; border-radius:50%; background:#4caf50; display:none; flex-shrink:0; }
    .ri-on-dot.on { display:block; }
    .ri-spanel { display:none; flex-direction:column; gap:8px; padding:10px 12px; }
    .ri-spanel.active { display:flex; }
    .ri-toolbar { display:flex; align-items:center; gap:6px; }
    .ri-toggle {
      padding:3px 12px; border-radius:6px;
      border:1px solid var(--lumiverse-border,rgba(255,255,255,0.12));
      background:var(--lumiverse-fill,rgba(255,255,255,0.06));
      color:var(--lumiverse-text-dim,rgba(255,255,255,0.4));
      cursor:pointer; font-size:11px; font-weight:600; font-family:inherit; letter-spacing:0.04em; transition:all 0.12s;
    }
    .ri-toggle.on {
      background:color-mix(in srgb,var(--lumiverse-accent,#6c63ff) 18%,transparent);
      border-color:var(--lumiverse-accent,#6c63ff); color:var(--lumiverse-accent,#6c63ff);
    }
    .ri-spacer { flex:1; }
    .ri-icon-btn {
      width:28px; height:28px; display:flex; align-items:center; justify-content:center;
      border-radius:6px; border:1px solid var(--lumiverse-border,rgba(255,255,255,0.1));
      background:var(--lumiverse-fill,rgba(255,255,255,0.05));
      color:var(--lumiverse-text-dim,rgba(255,255,255,0.4));
      cursor:pointer; font-size:13px; padding:0; transition:all 0.12s; flex-shrink:0;
    }
    .ri-icon-btn:hover { background:var(--lumiverse-fill-hover,rgba(255,255,255,0.1)); color:var(--lumiverse-text,#e0e0f0); }
    .ri-icon-btn.danger:hover { color:#e05050; }
    .ri-textarea {
      width:100%; min-height:64px; max-height:160px; resize:vertical; padding:8px 10px; border-radius:8px;
      border:1px solid var(--lumiverse-border,rgba(255,255,255,0.1));
      background:var(--lumiverse-fill,rgba(255,255,255,0.06));
      color:var(--lumiverse-text,#e0e0f0); font-size:13px; font-family:inherit;
      outline:none; box-sizing:border-box; transition:border-color 0.12s;
    }
    .ri-textarea:focus { border-color:var(--lumiverse-accent,#6c63ff); }
    .ri-textarea::placeholder { color:var(--lumiverse-text-dim,rgba(255,255,255,0.3)); }
    .wfm-nav { display:none; align-items:center; gap:4px; }
    .wfm-nav.visible { display:flex; }
    .wfm-counter { font-size:11px; color:var(--lumiverse-text-dim,rgba(255,255,255,0.4)); min-width:36px; text-align:center; }
    .wfm-actions { display:flex; gap:6px; align-items:center; }
    .wfm-btn {
      padding:5px 14px; border-radius:7px;
      border:1px solid var(--lumiverse-border,rgba(255,255,255,0.12));
      background:var(--lumiverse-fill,rgba(255,255,255,0.06));
      color:var(--lumiverse-text,#e0e0f0); cursor:pointer; font-size:12px; font-family:inherit; transition:all 0.12s;
    }
    .wfm-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .wfm-btn.primary { background:var(--lumiverse-accent,#6c63ff); border-color:var(--lumiverse-accent,#6c63ff); color:#fff; }
    .wfm-btn.primary:hover:not(:disabled) { filter:brightness(1.1); }
    .wfm-loading { font-size:11px; color:var(--lumiverse-text-dim,rgba(255,255,255,0.4)); font-style:italic; display:none; }
    .wfm-loading.visible { display:inline; }

    #ri-float-btn {
      position:fixed; z-index:9998; width:44px; height:44px; border-radius:50%;
      background:var(--ri-btn-bg,var(--lumiverse-accent,#6c63ff));
      border:2.5px solid color-mix(in srgb,var(--ri-btn-bg,var(--lumiverse-accent,#6c63ff)) 55%,white);
      box-shadow:0 3px 14px rgba(0,0,0,0.4); cursor:pointer; display:flex; align-items:center;
      justify-content:center; color:#fff; font-size:20px; user-select:none; touch-action:none;
      overflow:visible; transition:box-shadow 0.15s,transform 0.12s;
    }
    #ri-float-btn img.ri-btn-img { border-radius:50%; }
    #ri-float-btn:hover { transform:scale(1.06); }
    #ri-float-btn.active {
      box-shadow:0 3px 14px rgba(0,0,0,0.4),0 0 0 3px color-mix(in srgb,var(--ri-btn-bg,var(--lumiverse-accent,#6c63ff)) 40%,transparent);
    }
    #ri-float-btn .ri-btn-label { position:relative; z-index:1; pointer-events:none; }
    #ri-float-btn img.ri-btn-img {
      position:absolute; inset:0; width:100%; height:100%;
      object-fit:cover; border-radius:50%; pointer-events:none;
    }
    #ri-float-btn .ri-btn-dot {
      position:absolute; top:-2px; right:-2px; width:10px; height:10px;
      border-radius:50%; background:#4caf50; border:2px solid var(--lumiverse-bg,#111);
      display:none; z-index:2;
    }
    #ri-float-btn .ri-btn-dot.on { display:block; }

    #ri-custom-popup {
      position:fixed; z-index:10000;
      background:var(--lumiverse-surface,var(--lumiverse-bg,#1a1a2e));
      border:1px solid var(--lumiverse-border,rgba(255,255,255,0.14));
      border-radius:10px; box-shadow:0 8px 28px rgba(0,0,0,0.5);
      padding:12px; display:none; flex-direction:column; gap:10px;
      width:220px; font-size:12px; color:var(--lumiverse-text,#e0e0f0); font-family:inherit;
    }
    #ri-custom-popup.open { display:flex; }
    .ri-clabel { font-size:11px; font-weight:600; letter-spacing:0.04em; color:var(--lumiverse-text-dim,rgba(255,255,255,0.4)); text-transform:uppercase; margin-bottom:2px; }
    .ri-csection { display:flex; flex-direction:column; gap:5px; }
    .ri-color-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .ri-swatch { width:24px; height:24px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:border-color 0.12s; flex-shrink:0; }
    .ri-swatch:hover,.ri-swatch.active { border-color:#fff; }
    .ri-swatch.accent { background:var(--lumiverse-accent,#6c63ff); }
    #ri-color-pick {
      width:28px; height:28px; border-radius:50%; border:2px solid var(--lumiverse-border,rgba(255,255,255,0.15));
      padding:0; cursor:pointer; background:none; flex-shrink:0; -webkit-appearance:none; appearance:none; overflow:hidden;
    }
    #ri-color-pick::-webkit-color-swatch-wrapper { padding:0; }
    #ri-color-pick::-webkit-color-swatch { border:none; border-radius:50%; }
    .ri-upbtn,.ri-rmbtn,.ri-resetbtn { padding:4px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-family:inherit; text-align:center; transition:all 0.12s; }
    .ri-upbtn { border:1px solid var(--lumiverse-border,rgba(255,255,255,0.12)); background:var(--lumiverse-fill,rgba(255,255,255,0.06)); color:var(--lumiverse-text,#e0e0f0); }
    .ri-upbtn:hover { background:var(--lumiverse-fill-hover,rgba(255,255,255,0.1)); }
    .ri-rmbtn { border:1px solid rgba(224,80,80,0.3); background:rgba(224,80,80,0.08); color:#e05050; display:none; }
    .ri-rmbtn.visible { display:block; }
    .ri-rmbtn:hover { background:rgba(224,80,80,0.16); }
    .ri-divider { height:1px; background:var(--lumiverse-border,rgba(255,255,255,0.1)); margin:0 -2px; }
    .ri-resetbtn { border:1px solid var(--lumiverse-border,rgba(255,255,255,0.12)); background:var(--lumiverse-fill,rgba(255,255,255,0.06)); color:var(--lumiverse-text-dim,rgba(255,255,255,0.45)); }
    .ri-resetbtn:hover { color:var(--lumiverse-text,#e0e0f0); }

    .ri-preset-list { display:flex; flex-direction:column; gap:5px; max-height:260px; overflow-y:auto; margin-bottom:8px; }
    .ri-preset-row {
      display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:8px;
      border:1px solid var(--lumiverse-border,rgba(255,255,255,0.1));
      background:var(--lumiverse-fill,rgba(255,255,255,0.05)); cursor:pointer; transition:background 0.1s;
    }
    .ri-preset-row:hover { background:var(--lumiverse-fill-hover,rgba(255,255,255,0.09)); }
    .ri-preset-name { flex:1; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ri-preset-del { font-size:13px; color:var(--lumiverse-text-dim,rgba(255,255,255,0.35)); cursor:pointer; padding:2px 4px; border-radius:4px; transition:color 0.1s; flex-shrink:0; }
    .ri-preset-del:hover { color:#e05050; }
    .ri-preset-empty { text-align:center; color:var(--lumiverse-text-dim,rgba(255,255,255,0.35)); font-size:13px; padding:14px 0; }
    .ri-preset-save-row { display:flex; gap:6px; }
    .ri-preset-input {
      flex:1; padding:5px 10px; border-radius:7px;
      border:1px solid var(--lumiverse-border,rgba(255,255,255,0.1));
      background:var(--lumiverse-fill,rgba(255,255,255,0.06));
      color:var(--lumiverse-text,#e0e0f0); font-size:13px; font-family:inherit; outline:none;
    }
    .ri-preset-input:focus { border-color:var(--lumiverse-accent,#6c63ff); }
  `;
  document.head.appendChild(styleEl);

  // ─── Strip panel ──────────────────────────────────────────────────────────────

  const strip = document.createElement('div');
  strip.id = 'ri-strip';
  strip.innerHTML = `
    <div id="ri-strip-tabs">
      <button class="ri-stab active" data-tab="ri"><span class="ri-on-dot" id="ri-on-dot"></span>Instructions</button>
      <button class="ri-stab" data-tab="wfm">Write For Me</button>
      <button id="ri-strip-close">✕</button>
    </div>
    <div class="ri-spanel active" id="ri-sub-ri">
      <div class="ri-toolbar">
        <button class="ri-toggle" id="ri-toggle">OFF</button>
        <span class="ri-spacer"></span>
        <button class="ri-icon-btn" id="ri-presets-btn" title="Presets">📁</button>
        <button class="ri-icon-btn danger" id="ri-clear-btn" title="Clear">🗑</button>
      </div>
      <textarea class="ri-textarea" id="ri-textarea" placeholder="Steer the AI's next reply — no character limit.&#10;e.g. 'respond shyly and avoid eye contact'"></textarea>
    </div>
    <div class="ri-spanel" id="ri-sub-wfm">
      <div class="ri-toolbar"><span class="ri-spacer"></span><button class="ri-icon-btn" id="wfm-presets-btn" title="Presets">📁</button></div>
      <textarea class="ri-textarea" id="wfm-instruction" placeholder="Optional: how to write it — e.g. 'act nervous, avoid eye contact'"></textarea>
      <textarea class="ri-textarea" id="wfm-draft" placeholder="Draft appears here…" style="min-height:72px"></textarea>
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
    </div>`;

  // InputArea is position:absolute;bottom:8px inside a flex parent.
  // We can't use DOM flow. Instead: fix strip above InputArea via padding-bottom on parent.
  document.body.appendChild(strip);

  function getInputArea() {
    return document.querySelector('[data-component="InputArea"]');
  }
  function getInputParent() {
    return getInputArea()?.parentElement;
  }

  function mountStrip() {
    // no-op: strip is appended to body, positioned via JS below
  }

  function positionStrip() {
    const ia = getInputArea();
    if (!ia) return;
    const rect = ia.getBoundingClientRect();
    strip.style.position = 'fixed';
    strip.style.left   = rect.left + 'px';
    strip.style.right  = (window.innerWidth - rect.right) + 'px';
    strip.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    strip.style.zIndex = '9991'; // drawer is 9992, strip sits just below it
  }

  function updateParentPadding() {
    const parent = getInputParent();
    if (!parent) return;
    if (panelOpen && strip.classList.contains('open')) {
      const h = strip.getBoundingClientRect().height;
      parent.style.paddingBottom = h + 'px';
    } else {
      parent.style.paddingBottom = '';
    }
  }

  const ro = new ResizeObserver(() => { positionStrip(); updateParentPadding(); });
  const iaEl = getInputArea();
  if (iaEl) ro.observe(iaEl);
  window.addEventListener('resize', () => { positionStrip(); updateParentPadding(); });

  // initial position (hidden but measured after open)
  positionStrip();

  strip.querySelectorAll('.ri-stab').forEach(t => {
    t.addEventListener('click', () => {
      strip.querySelectorAll('.ri-stab').forEach(x => x.classList.remove('active'));
      strip.querySelectorAll('.ri-spanel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      strip.querySelector(t.dataset.tab === 'ri' ? '#ri-sub-ri' : '#ri-sub-wfm').classList.add('active');
    });
  });
  strip.querySelector('#ri-strip-close').addEventListener('click', () => {
    panelOpen = false; strip.classList.remove('open'); btn.classList.remove('active');
    updateParentPadding();
  });

  const q = s => strip.querySelector(s);
  const riOnDot=q('#ri-on-dot'), riToggle=q('#ri-toggle'), riTextarea=q('#ri-textarea');
  const riClearBtn=q('#ri-clear-btn'), riPresetsBtn=q('#ri-presets-btn');
  const wfmInstruction=q('#wfm-instruction'), wfmDraft=q('#wfm-draft');
  const wfmNav=q('#wfm-nav'), wfmCounter=q('#wfm-counter');
  const wfmPrev=q('#wfm-prev'), wfmNext=q('#wfm-next');
  const wfmGenerate=q('#wfm-generate'), wfmUse=q('#wfm-use');
  const wfmLoadingEl=q('#wfm-loading'), wfmPresetsBtn=q('#wfm-presets-btn');

  // ─── Float button ─────────────────────────────────────────────────────────────

  const btn = document.createElement('div');
  btn.id = 'ri-float-btn';
  btn.title = 'Response Instructions (right-click to customize)';
  btn.innerHTML = `<span class="ri-btn-label">✦</span><span class="ri-btn-dot" id="ri-btn-dot"></span>`;
  document.body.appendChild(btn);
  const btnDot=btn.querySelector('#ri-btn-dot'), btnLabel=btn.querySelector('.ri-btn-label');

  function applyBtnCfg() {
    btn.style.setProperty('--ri-btn-bg', C.color||'');
    btn.querySelector('img.ri-btn-img')?.remove();
    if (C.image) {
      const img=document.createElement('img'); img.className='ri-btn-img'; img.src=C.image; btn.appendChild(img);
      btnLabel.style.display='none';
    } else { btnLabel.style.display=''; }
    if (C.x!=null&&C.y!=null) {
      btn.style.left=Math.max(0,Math.min(window.innerWidth-48,C.x))+'px';
      btn.style.top=Math.max(0,Math.min(window.innerHeight-48,C.y))+'px';
      btn.style.bottom=''; btn.style.right='';
    } else { btn.style.bottom='80px'; btn.style.left='12px'; btn.style.top=''; btn.style.right=''; }
  }
  applyBtnCfg();
  window.addEventListener('resize', () => { if (C.x==null) applyBtnCfg(); });

  let dragging=false, didDrag=false, dOffX=0, dOffY=0;
  btn.addEventListener('pointerdown', e => {
    if (e.button===2) return;
    dragging=true; didDrag=false;
    const r=btn.getBoundingClientRect(); dOffX=e.clientX-r.left; dOffY=e.clientY-r.top;
    btn.setPointerCapture(e.pointerId); e.preventDefault();
  });
  btn.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (Math.abs(e.movementX)+Math.abs(e.movementY)>3) didDrag=true;
    btn.style.left=Math.max(0,Math.min(window.innerWidth-48,e.clientX-dOffX))+'px';
    btn.style.top=Math.max(0,Math.min(window.innerHeight-48,e.clientY-dOffY))+'px';
    btn.style.bottom=''; btn.style.right='';
  });
  btn.addEventListener('pointerup', () => {
    if (!dragging) return; dragging=false;
    if (didDrag) { const r=btn.getBoundingClientRect(); C=saveCfg({x:r.left,y:r.top}); return; }
    closeCustom();
    panelOpen=!panelOpen;
    strip.classList.toggle('open',panelOpen); btn.classList.toggle('active',panelOpen);
    positionStrip();
    // small delay to let strip render before measuring height
    setTimeout(updateParentPadding, 20);
  });
  btn.addEventListener('contextmenu', e => { e.preventDefault(); openCustom(e.clientX,e.clientY); });
  let lpTimer=null;
  btn.addEventListener('touchstart', e => { lpTimer=setTimeout(()=>{lpTimer=null;didDrag=true;const t=e.touches[0];openCustom(t.clientX,t.clientY);navigator.vibrate?.(40);},500); },{passive:true});
  btn.addEventListener('touchend', ()=>{ if(lpTimer){clearTimeout(lpTimer);lpTimer=null;} });
  btn.addEventListener('touchmove', ()=>{ if(lpTimer){clearTimeout(lpTimer);lpTimer=null;} });

  document.addEventListener('pointerdown', e => {
    // panel stays open until explicitly closed via button or ✕
    if (customOpen&&!customPopup.contains(e.target)&&!btn.contains(e.target)) closeCustom();
  }, true);

  // ─── Customize popup ──────────────────────────────────────────────────────────

  const PCOLS=['#6c63ff','#e05c8a','#3eb489','#f0a500','#4db8ff','#b06bff'];
  const customPopup=document.createElement('div'); customPopup.id='ri-custom-popup';
  customPopup.innerHTML=`
    <div class="ri-csection"><div class="ri-clabel">Button Color</div>
      <div class="ri-color-row" id="ri-swatches">
        <div class="ri-swatch accent" data-color="" title="Theme accent"></div>
        ${PCOLS.map(c=>`<div class="ri-swatch" data-color="${c}" style="background:${c}"></div>`).join('')}
        <input type="color" id="ri-color-pick" />
      </div>
    </div>
    <div class="ri-divider"></div>
    <div class="ri-csection"><div class="ri-clabel">Button Image</div>
      <label class="ri-upbtn">📁 Upload image<input type="file" id="ri-img-file" accept="image/*" style="display:none"/></label>
      <div class="ri-rmbtn" id="ri-rm-img">✕ Remove image</div>
    </div>
    <div class="ri-divider"></div>
    <div class="ri-resetbtn" id="ri-reset-pos">↺ Reset position</div>`;
  document.body.appendChild(customPopup);

  function openCustom(x,y) {
    customOpen=true; customPopup.classList.add('open');
    customPopup.querySelectorAll('.ri-swatch').forEach(s=>s.classList.toggle('active',s.dataset.color===(C.color||'')));
    customPopup.querySelector('#ri-rm-img').classList.toggle('visible',!!C.image);
    const pw=220,ph=210;
    customPopup.style.left=Math.max(8,Math.min(window.innerWidth-pw-8,x))+'px';
    customPopup.style.top=Math.max(8,Math.min(window.innerHeight-ph-8,y-ph-8))+'px';
    if (panelOpen) { panelOpen=false; strip.classList.remove('open'); btn.classList.remove('active'); }
  }
  function closeCustom() { customOpen=false; customPopup.classList.remove('open'); }

  customPopup.querySelectorAll('.ri-swatch').forEach(s=>{
    s.addEventListener('click',()=>{
      C=saveCfg({color:s.dataset.color}); applyBtnCfg();
      customPopup.querySelectorAll('.ri-swatch').forEach(x=>x.classList.remove('active')); s.classList.add('active');
    });
  });
  const cpick=customPopup.querySelector('#ri-color-pick'); cpick.value=C.color||'#6c63ff';
  cpick.addEventListener('input',()=>{ C=saveCfg({color:cpick.value}); applyBtnCfg(); customPopup.querySelectorAll('.ri-swatch').forEach(s=>s.classList.remove('active')); });
  customPopup.querySelector('#ri-img-file').addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>{ C=saveCfg({image:ev.target.result}); applyBtnCfg(); customPopup.querySelector('#ri-rm-img').classList.add('visible'); };
    r.readAsDataURL(f); e.target.value='';
  });
  customPopup.querySelector('#ri-rm-img').addEventListener('click',()=>{ C=saveCfg({image:''}); applyBtnCfg(); customPopup.querySelector('#ri-rm-img').classList.remove('visible'); });
  customPopup.querySelector('#ri-reset-pos').addEventListener('click',()=>{ C=saveCfg({x:null,y:null}); applyBtnCfg(); closeCustom(); });

  // ─── RI ──────────────────────────────────────────────────────────────────────

  function syncRI() {
    ctx.sendToBackend({type:'ri:set',text:riText,enabled:riEnabled});
    riOnDot.classList.toggle('on',riEnabled); btnDot.classList.toggle('on',riEnabled);
    riToggle.textContent=riEnabled?'ON':'OFF'; riToggle.classList.toggle('on',riEnabled);
  }
  riToggle.addEventListener('click',()=>{ riEnabled=!riEnabled; syncRI(); });
  riTextarea.addEventListener('input',()=>{ riText=riTextarea.value; syncRI(); });
  riClearBtn.addEventListener('click',()=>{ riText=''; riEnabled=false; riTextarea.value=''; syncRI(); });

  // ─── WFM ─────────────────────────────────────────────────────────────────────

  function updateWfmUI() {
    const has=wfmDrafts.length>0; wfmUse.disabled=!has;
    wfmNav.classList.toggle('visible',wfmDrafts.length>1);
    if(has){ wfmDraft.value=wfmDrafts[wfmDraftIdx]; wfmCounter.textContent=`${wfmDraftIdx+1} / ${wfmDrafts.length}`; }
  }
  wfmGenerate.addEventListener('click',()=>{
    if(wfmLoading) return; wfmLoading=true; wfmGenerate.disabled=true; wfmLoadingEl.classList.add('visible');
    wfmPendingId=Math.random().toString(36).slice(2);
    ctx.sendToBackend({type:'wfm:generate',instruction:wfmInstruction.value.trim(),requestId:wfmPendingId});
  });
  wfmPrev.addEventListener('click',()=>{ if(wfmDraftIdx>0){wfmDraftIdx--;updateWfmUI();} });
  wfmNext.addEventListener('click',()=>{ if(wfmDraftIdx<wfmDrafts.length-1){wfmDraftIdx++;updateWfmUI();} });
  wfmDraft.addEventListener('input',()=>{ if(wfmDrafts.length>0) wfmDrafts[wfmDraftIdx]=wfmDraft.value; });
  wfmUse.addEventListener('click',()=>{
    const text=wfmDraft.value.trim(); if(!text) return;
    const inp=document.querySelector('textarea[name="chat-message"],textarea[aria-label="Message"]');
    if(inp){ inp.value=text; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.focus(); }
    else navigator.clipboard?.writeText(text).catch(()=>{});
  });

  // ─── Presets ──────────────────────────────────────────────────────────────────

  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  riPresetsBtn.addEventListener('click',()=>{ pendingPresetStore='ri'; ctx.sendToBackend({type:'preset:load',store:'ri'}); });
  wfmPresetsBtn.addEventListener('click',()=>{ pendingPresetStore='wfm'; ctx.sendToBackend({type:'preset:load',store:'wfm'}); });

  function showPresetModal(store,presets) {
    const isRi=store==='ri', curText=isRi?riText:wfmInstruction.value;
    const modal=ctx.ui.showModal({title:isRi?'RI Presets':'WFM Presets',width:400,maxHeight:480});
    function render() {
      const names=Object.keys(presets);
      modal.root.innerHTML=`
        <div class="ri-preset-list">
          ${!names.length?'<div class="ri-preset-empty">No presets yet.</div>'
            :names.map(n=>`<div class="ri-preset-row" data-name="${esc(n)}"><span class="ri-preset-name">${esc(n)}</span><span class="ri-preset-del" data-del="${esc(n)}">✕</span></div>`).join('')}
        </div>
        <div class="ri-preset-save-row">
          <input class="ri-preset-input" id="pm-name" placeholder="Preset name…"/>
          <button class="wfm-btn primary" id="pm-save">Save current</button>
        </div>`;
      modal.root.querySelectorAll('.ri-preset-row').forEach(row=>{
        row.addEventListener('click',e=>{
          if(e.target.dataset.del) return;
          const text=presets[row.dataset.name]??'';
          if(isRi){riText=text;riTextarea.value=text;syncRI();}else{wfmInstruction.value=text;}
          modal.dismiss();
        });
      });
      modal.root.querySelectorAll('[data-del]').forEach(b=>{
        b.addEventListener('click',e=>{ e.stopPropagation(); ctx.sendToBackend({type:'preset:delete',store,name:b.dataset.del}); delete presets[b.dataset.del]; render(); });
      });
      modal.root.querySelector('#pm-save').addEventListener('click',()=>{
        const name=modal.root.querySelector('#pm-name').value.trim(); if(!name) return;
        ctx.sendToBackend({type:'preset:save',store,name,text:curText}); presets[name]=curText; modal.root.querySelector('#pm-name').value=''; render();
      });
    }
    render();
  }

  // ─── Backend ──────────────────────────────────────────────────────────────────

  const unsubBackend=ctx.onBackendMessage(payload=>{
    if(payload.type==='preset:data'){
      if(payload.store==='ri') riPresets=payload.data; else wfmPresets=payload.data;
      if(pendingPresetStore===payload.store){ pendingPresetStore=null; showPresetModal(payload.store,payload.store==='ri'?riPresets:wfmPresets); }
      return;
    }
    if(payload.type==='wfm:result'&&payload.requestId===wfmPendingId){
      wfmLoading=false; wfmGenerate.disabled=false; wfmLoadingEl.classList.remove('visible');
      wfmDrafts.push(payload.text); wfmDraftIdx=wfmDrafts.length-1; updateWfmUI(); wfmPendingId=null; return;
    }
    if(payload.type==='wfm:error'&&payload.requestId===wfmPendingId){
      wfmLoading=false; wfmGenerate.disabled=false; wfmLoadingEl.classList.remove('visible');
      wfmDraft.value=`Error: ${payload.error}`; wfmPendingId=null; return;
    }
  });

  ctx.sendToBackend({type:'preset:load',store:'ri'});
  ctx.sendToBackend({type:'preset:load',store:'wfm'});

  return ()=>{
    unsubBackend();
    ro.disconnect();
    const parent = getInputParent(); if (parent) parent.style.paddingBottom = '';
    strip.remove(); btn.remove(); customPopup.remove(); styleEl.remove();
    window.removeEventListener('resize', positionStrip);
  };
}
