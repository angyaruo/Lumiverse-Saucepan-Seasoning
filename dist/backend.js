// Response Instructions + Write For Me — Lumiverse Spindle Backend v2.0
// storage is free-tier — no permission needed
// interceptor + generation permissions declared in spindle.json
// spindle is a global provided by the Spindle runtime — no import needed

// ─── State ───────────────────────────────────────────────────────────────────

let activeInstruction = '';
let instructionEnabled = false;

// ─── Interceptor ─────────────────────────────────────────────────────────────

spindle.registerInterceptor(async (messages) => {
  if (!instructionEnabled || !activeInstruction.trim()) return messages;

  const injected = {
    role: 'system',
    content: `[Response Instructions]\n${activeInstruction.trim()}`,
  };

  // Insert just before the last user message — mirrors ST Author's Note depth
  const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
  const insertAt = lastUserIdx === -1 ? messages.length : messages.length - lastUserIdx;

  const result = [...messages];
  result.splice(insertAt, 0, injected);

  return {
    messages: result,
    breakdown: [{ messageIndex: insertAt, name: 'Response Instructions' }],
  };
}, 10);

// ─── Frontend Message Handlers ────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload, userId) => {

  // Instruction state sync
  if (payload.type === 'ri:set') {
    activeInstruction = payload.text ?? '';
    instructionEnabled = payload.enabled ?? false;
    return;
  }

  // Preset: save
  if (payload.type === 'preset:save') {
    const { store, name, text } = payload;
    const key = `presets_${store}.json`;
    const data = await spindle.storage.getJson(key, { fallback: {} });
    data[name] = text;
    await spindle.storage.setJson(key, data);
    spindle.sendToFrontend({ type: 'preset:saved', store, name }, userId);
    return;
  }

  // Preset: delete
  if (payload.type === 'preset:delete') {
    const { store, name } = payload;
    const key = `presets_${store}.json`;
    const data = await spindle.storage.getJson(key, { fallback: {} });
    delete data[name];
    await spindle.storage.setJson(key, data);
    spindle.sendToFrontend({ type: 'preset:deleted', store, name }, userId);
    return;
  }

  // Preset: load
  if (payload.type === 'preset:load') {
    const key = `presets_${payload.store}.json`;
    const data = await spindle.storage.getJson(key, { fallback: {} });
    spindle.sendToFrontend({ type: 'preset:data', store: payload.store, data }, userId);
    return;
  }

  // Write For Me: generate
  if (payload.type === 'wfm:generate') {
    const { instruction, requestId } = payload;

    const sys = `You are a creative writing assistant helping the user draft their next message in a roleplay.${instruction ? `\nUser's direction: ${instruction}` : ''}
Write ONLY the message — no preamble, no quotes around it, first person unless context says otherwise. Match the conversation's tone.`;

    try {
      const result = await spindle.generate.quiet({
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: 'Write my next message.' },
        ],
      });
      spindle.sendToFrontend({ type: 'wfm:result', requestId, text: result.content.trim() }, userId);
    } catch (err) {
      spindle.sendToFrontend({ type: 'wfm:error', requestId, error: err?.message ?? 'Generation failed' }, userId);
    }
    return;
  }
});

spindle.log.info('[RI] backend v2 loaded');
