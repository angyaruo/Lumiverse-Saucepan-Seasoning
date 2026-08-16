// Response Instructions + Write For Me — backend

let activeInstruction = '';
let instructionEnabled = false;
let savedPresets = {};
let savedWfmDir = '';
let savedDrafts = [];
let savedRiMode = 'simple';
let savedSimple = {};

// ─── Storage (file-based: spindle.storage.read / write) ───────────────────────
async function loadState(userId) {
  try {
    const raw = await spindle.storage.read(`state_${userId ?? 'default'}.json`);
    const parsed = JSON.parse(raw);
    activeInstruction  = parsed.instruction   ?? '';
    instructionEnabled = parsed.enabled       ?? false;
    savedPresets       = parsed.presets       ?? {};
    savedWfmDir        = parsed.wfm_direction ?? '';
    savedDrafts        = parsed.saved_drafts  ?? [];
    savedRiMode        = parsed.ri_mode       ?? 'simple';
    savedSimple        = parsed.simple        ?? {};
  } catch (_) {}
}

async function persistState(userId) {
  try {
    await spindle.storage.write(`state_${userId ?? 'default'}.json`, JSON.stringify({
      instruction:   activeInstruction,
      enabled:       instructionEnabled,
      presets:       savedPresets,
      wfm_direction: savedWfmDir,
      saved_drafts:  savedDrafts,
      ri_mode:       savedRiMode,
      simple:        savedSimple,
    }));
  } catch (_) {}
}

// ─── Frontend messages ────────────────────────────────────────────────────────
spindle.onFrontendMessage(async (payload, userId) => {
  if (!payload) return;

  if (payload.type === 'ri:load') {
    await loadState(userId);
    spindle.sendToFrontend({
      type: 'ri:state',
      state: {
        instruction:   activeInstruction,
        enabled:       instructionEnabled,
        presets:       savedPresets,
        wfm_direction: savedWfmDir,
        saved_drafts:  savedDrafts,
        ri_mode:       savedRiMode,
        simple:        savedSimple,
      },
    }, userId);
  }

  if (payload.type === 'ri:update') {
    // _active_instruction is the composed string (simple or custom mode)
    activeInstruction  = payload._active_instruction ?? payload.instruction ?? activeInstruction;
    instructionEnabled = payload.enabled       ?? instructionEnabled;
    savedPresets       = payload.presets       ?? savedPresets;
    savedWfmDir        = payload.wfm_direction ?? savedWfmDir;
    savedDrafts        = payload.saved_drafts  ?? savedDrafts;
    savedRiMode        = payload.ri_mode       ?? savedRiMode;
    savedSimple        = payload.simple        ?? savedSimple;
    // persist full state for reload
    await persistState(userId);
  }

  if (payload.type === 'ri:generate') {
    const direction = payload.direction?.trim() || '';
    try {
      const connections = await spindle.connections.list(userId);
      const conn = connections?.find(c => c.is_default) ?? connections?.[0];
      if (!conn) throw new Error('No connection available — configure one in Lumiverse settings.');
      const result = await spindle.generate.quiet({
        type: 'quiet',
        userId,
        connection_id: conn.id,
        messages: [{
          role: 'user',
          content: direction
            ? `Draft a message for me to send in this roleplay chat. Direction: ${direction}`
            : 'Draft a short message for me to send in this roleplay chat, fitting the current context.',
        }],
        parameters: { max_tokens: 512 },
        reasoning: { source: 'off' },
      });
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
await loadState('default');
