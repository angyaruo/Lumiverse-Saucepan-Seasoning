// Response Instructions + Write For Me — Lumiverse Spindle Backend

let activeInstruction = '';
let instructionEnabled = false;
let savedState = {
  instruction: '',
  enabled: false,
  presets: {},
  wfm_direction: '',
};

// ─── Load/save via spindle.storage ─────────────────────────────────────────────
const STORAGE_KEY = 'ri_state';

async function loadState() {
  try {
    const raw = await spindle.storage.get(STORAGE_KEY);
    if (raw) savedState = { ...savedState, ...JSON.parse(raw) };
  } catch (_) {}
}

async function persistState() {
  try {
    await spindle.storage.set(STORAGE_KEY, JSON.stringify(savedState));
  } catch (_) {}
}

// ─── Frontend messages ────────────────────────────────────────────────────────
spindle.on('frontend:message', async (payload) => {
  if (!payload) return;

  if (payload.type === 'ri:load') {
    // Frontend requests saved state on mount
    await loadState();
    activeInstruction  = savedState.instruction ?? '';
    instructionEnabled = savedState.enabled      ?? false;
    spindle.sendToFrontend({ type: 'ri:state', state: savedState });
  }

  if (payload.type === 'ri:update') {
    // Frontend sends state updates
    activeInstruction  = payload.instruction ?? '';
    instructionEnabled = payload.enabled     ?? false;
    savedState = {
      ...savedState,
      instruction:   activeInstruction,
      enabled:       instructionEnabled,
      presets:       payload.presets       ?? savedState.presets,
      wfm_direction: payload.wfm_direction ?? savedState.wfm_direction,
    };
    await persistState();
  }

  if (payload.type === 'ri:generate') {
    // Frontend requests Write For Me generation
    const direction = payload.direction?.trim() || '';
    try {
      const result = await spindle.generate({
        messages: [{
          role: 'user',
          content: direction
            ? `Draft a message for me to send in this roleplay chat. Direction: ${direction}`
            : 'Draft a short message for me to send in this roleplay chat, fitting the current context.',
        }],
        max_tokens: 512,
      });
      const text = result?.text ?? result?.content ?? '';
      spindle.sendToFrontend({ type: 'ri:draft', text });
    } catch (err) {
      spindle.sendToFrontend({ type: 'ri:draft', text: '', error: err?.message ?? 'generation failed' });
    }
  }
});

// ─── Prompt interceptor ────────────────────────────────────────────────────────
spindle.registerInterceptor(async (messages) => {
  if (!instructionEnabled || !activeInstruction.trim()) return messages;

  const injected = {
    role: 'system',
    content: `[Response Instructions]\n${activeInstruction.trim()}`,
  };

  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') { lastUserIdx = i; break; }
  }

  const at = lastUserIdx === -1 ? messages.length : lastUserIdx;
  return [...messages.slice(0, at), injected, ...messages.slice(at)];
});

// Init
await loadState();
activeInstruction  = savedState.instruction ?? '';
instructionEnabled = savedState.enabled     ?? false;
