// Response Instructions + Write For Me — Lumiverse Spindle Backend

let activeInstruction = '';
let instructionEnabled = false;

// Receive state updates pushed from frontend
spindle.on('ri:update', (data) => {
  activeInstruction = data?.instruction ?? '';
  instructionEnabled = data?.enabled ?? false;
});

// Inject instruction just before the last user message (Author's Note style)
spindle.registerInterceptor(async (messages) => {
  if (!instructionEnabled || !activeInstruction.trim()) {
    return messages;
  }

  const injected = {
    role: 'system',
    content: `[Response Instructions]\n${activeInstruction.trim()}`,
  };

  // Find last user message index
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') { lastUserIdx = i; break; }
  }

  const insertAt = lastUserIdx === -1 ? messages.length : lastUserIdx;
  return [
    ...messages.slice(0, insertAt),
    injected,
    ...messages.slice(insertAt),
  ];
});
