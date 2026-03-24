// LeetCrack - Sandbox Execution Environment
// Runs inside a Chrome sandboxed iframe with opaque origin — no chrome.*, no network, no storage
// Receives code via postMessage, executes via Function(), captures console output

window.addEventListener('message', (event) => {
  if (!event.data || event.data.action !== 'execute') return;

  const code = event.data.code;
  const logs = [];

  // Fake console that captures all output
  const fakeConsole = {
    log: (...args) => logs.push(formatArgs(args)),
    warn: (...args) => logs.push('[WARN] ' + formatArgs(args)),
    error: (...args) => logs.push('[ERROR] ' + formatArgs(args)),
    info: (...args) => logs.push('[INFO] ' + formatArgs(args)),
    table: (data) => logs.push(JSON.stringify(data, null, 2)),
  };

  try {
    // Wrap user code in strict mode with our fake console injected
    const wrappedCode = `
      "use strict";
      ${code}
    `;

    const fn = new Function('console', wrappedCode);
    const result = fn(fakeConsole);

    event.source.postMessage({
      action: 'result',
      success: true,
      logs: logs,
      returnValue: result !== undefined ? stringify(result) : null
    }, '*');
  } catch (err) {
    event.source.postMessage({
      action: 'result',
      success: false,
      error: `${err.name}: ${err.message}`,
      logs: logs
    }, '*');
  }
});

function formatArgs(args) {
  return args.map(a => {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'object') return JSON.stringify(a, null, 2);
    return String(a);
  }).join(' ');
}

function stringify(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
