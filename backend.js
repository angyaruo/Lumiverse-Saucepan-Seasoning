// Response Instructions + Write For Me — Lumiverse Spindle Backend
// Handles: prompt interceptor injection, Write For Me generation, preset persistence
//
// Ported from bumyann/sillytavern-response-instructions
// ST used /inject (STscript) at Author's Note depth. Spindle equivalent: registerInterceptor.

declare const spindle;

// ─── State ───────────────────────────────────────────────────────────────────

let activeInstruction = '';      // current instruction text
let instructionEnabled = false;  // toggle

// ─── Interceptor ─────────────────────────────────────────────────────────────
// Injects the active instruction as a system message just before the LLM call.
// Priority 10 = runs early (low number = first), so it's near the top of context.

spindle.registerInterceptor(async (messages, context) => {
  if (!instructionEnabled || !activeInstruction.trim()) {
    return messages;
  }

  const injected = {
    role: 'system',
    content: `[Response Instructions]\n${activeInstruction.trim()}`,
  };

  // Inject just before the last user message for maximum influence,
  // mirroring ST's Author's Note depth behaviour.
  const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
  const insertAt = lastUserIdx === -1
    ? messages.length
    : messages.length - lastUserIdx;

  const result = [...messages];
  result.splice(insertAt, 0, injected);

  return {
    messages: result,
    breakdown: [{ messageIndex: insertAt, name: 'Response Instructions' }],
  };
}, 10);

// ─── Frontend Message Handlers ────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload, userId) => {

  // ── Instruction state sync (frontend → backend) ──
  if (payload.type === 'set_instruction') {
    activeInstruction = payload.text ?? '';
    instructionEnabled = payload.enabled ?? false;
    return;
  }

  // ── Preset: save ──
  if (payload.type === 'save_preset') {
    const { store, name, text } = payload;
    // store = 'ri' | 'wfm'
    const key = `presets_${store}.json`;
    const existing = await spindle.storage.getJson(key, { fallback: {} });
    existing[name] = text;
    await spindle.storage.setJson(key, existing, { indent: 2 });
    spindle.sendToFrontend({ type: 'preset_saved', store, name }, userId);
    return;
  }

  // ── Preset: delete ──
  if (payload.type === 'delete_preset') {
    const { store, name } = payload;
    const key = `presets_${store}.json`;
    const existing = await spindle.storage.getJson(key, { fallback: {} });
    delete existing[name];
    await spindle.storage.setJson(key, existing, { indent: 2 });
    spindle.sendToFrontend({ type: 'preset_deleted', store, name }, userId);
    return;
  }

  // ── Preset: load all ──
  if (payload.type === 'load_presets') {
    const { store } = payload;
    const key = `presets_${store}.json`;
    const data = await spindle.storage.getJson(key, { fallback: {} });
    spindle.sendToFrontend({ type: 'presets_loaded', store, data }, userId);
    return;
  }

  // ── Write For Me: generate ──
  if (payload.type === 'generate_wfm') {
    const { instruction, chatContext, requestId } = payload;

    const systemPrompt = `You are a creative writing assistant helping the user draft their next message in an ongoing roleplay or chat.
${instruction ? `The user's instruction: ${instruction}` : ''}
Write ONLY the user's message — no narration, no quotes around it, no preamble. Write naturally in first person unless the context clearly calls for otherwise. Match the tone and style of the conversation.`;

    try {
      const result = await spindle.generate.quiet({
        messages: [
          { role: 'system', content: systemPrompt },
          ...(chatContext ?? []),
          { role: 'user', content: 'Write my next message.' },
        ],
      });

      spindle.sendToFrontend({
        type: 'wfm_result',
        requestId,
        text: result.content.trim(),
      }, userId);
    } catch (err) {
      spindle.sendToFrontend({
        type: 'wfm_error',
        requestId,
        error: err?.message ?? 'Generation failed',
      }, userId);
    }
    return;
  }
});

spindle.log.info('[Response Instructions] backend loaded');
