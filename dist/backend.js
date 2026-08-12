// Response Instructions + Write For Me — backend

let activeInstruction = '';
let instructionEnabled = false;
let savedPresets = {};
let savedWfmDir = '';
let savedDrafts = [];

// ─── Storage (file-based: spindle.storage.read / write) ───────────────────────
async function loadState() {
  try {
    const raw = await spindle.storage.read('state.json');
    const parsed = JSON.parse(raw);
    activeInstruction  = parsed.instruction   ?? '';
    instructionEnabled = parsed.enabled       ?? false;
    savedPresets       = parsed.presets       ?? {};
    savedWfmDir        = parsed.wfm_direction ?? '';
    savedDrafts        = parsed.saved_drafts  ?? [];
  } catch (_) {}
}

async function persistState() {
  try {
    await spindle.storage.write('state.json', JSON.stringify({
      instruction:   activeInstruction,
      enabled:       instructionEnabled,
      presets:       savedPresets,
      wfm_direction: savedWfmDir,
      saved_drafts:  savedDrafts,
    }));
  } catch (_) {}
}

// ─── Frontend messages ────────────────────────────────────────────────────────
spindle.onFrontendMessage(async (payload, userId) => {
  if (!payload) return;

  if (payload.type === 'ri:load') {
    await loadState();
    spindle.sendToFrontend({
      type: 'ri:state',
      state: {
        instruction:   activeInstruction,
        enabled:       instructionEnabled,
        presets:       savedPresets,
        wfm_direction: savedWfmDir,
        saved_drafts:  savedDrafts,
      },
    }, userId);
  }

  if (payload.type === 'ri:update') {
    activeInstruction  = payload.instruction   ?? activeInstruction;
    instructionEnabled = payload.enabled       ?? instructionEnabled;
    savedPresets       = payload.presets       ?? savedPresets;
    savedWfmDir        = payload.wfm_direction ?? savedWfmDir;
    savedDrafts        = payload.saved_drafts  ?? savedDrafts;
    await persistState();
  }

  if (payload.type === 'ri:generate') {
    const direction = payload.direction?.trim() || '';
    try {
      const result = await spindle.generate.quiet({
        messages: [{
          role: 'user',
          content: direction
            ? `Draft a message for me to send in this roleplay chat. Direction: ${direction}`
            : 'Draft a short message for me to send in this roleplay chat, fitting the current context.',
        }],
        parameters: { max_tokens: 512 },
      }, userId);
      const text = result?.content ?? '';
      spindle.sendToFrontend({ type: 'ri:draft', text }, userId);
    } catch (err) {
      spindle.sendToFrontend({ type: 'ri:draft', text: '', error: err?.message ?? 'generation failed' }, userId);
    }
  }
});

// ─── Prompt interceptor ────────────────────────────────────────────────────────
spindle.registerInterceptor(async (messages) => {
  if (!instructionEnabled || !activeInstruction.trim()) return messages;
  const injected = { role: 'system', content: `[Response Instructions]\n${activeInstruction.trim()}` };
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') { lastUserIdx = i; break; }
  }
  const at = lastUserIdx === -1 ? messages.length : lastUserIdx;
  return [...messages.slice(0, at), injected, ...messages.slice(at)];
}, 10);

spindle.log.info('Response Instructions loaded!');

// Init — load state so interceptor is armed on startup
await loadState();
