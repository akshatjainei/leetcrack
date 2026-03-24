// LeetCrack - Security Scanner
// Regex-based static analysis to block dangerous code patterns before sandbox execution
// Loaded by popup.html via <script> tag — exposes window.LeetCrackSecurity

const BANNED_PATTERNS = [
  { pattern: /\bfetch\s*\(/, reason: 'Network requests (fetch) are not allowed' },
  { pattern: /\bXMLHttpRequest\b/, reason: 'Network requests (XMLHttpRequest) are not allowed' },
  { pattern: /\bimport\s*\(/, reason: 'Dynamic imports are not allowed' },
  { pattern: /\brequire\s*\(/, reason: 'Module requires are not allowed' },
  { pattern: /\bdocument\b/, reason: 'DOM access is not allowed' },
  { pattern: /\bwindow\b/, reason: 'Window access is not allowed' },
  { pattern: /\blocalStorage\b/, reason: 'Storage access is not allowed' },
  { pattern: /\bsessionStorage\b/, reason: 'Storage access is not allowed' },
  { pattern: /\bindexedDB\b/, reason: 'Database access is not allowed' },
  { pattern: /\bWebSocket\b/, reason: 'WebSocket access is not allowed' },
  { pattern: /\bWorker\s*\(/, reason: 'Web Workers are not allowed' },
  { pattern: /\bSharedWorker\b/, reason: 'SharedWorkers are not allowed' },
  { pattern: /\beval\s*\(/, reason: 'eval() is not allowed' },
  { pattern: /\bFunction\s*\(/, reason: 'Function constructor is not allowed' },
  { pattern: /\bsetInterval\s*\(/, reason: 'setInterval is not allowed' },
  { pattern: /\bchrome\s*\./, reason: 'Chrome API access is not allowed' },
  { pattern: /\bprocess\s*\./, reason: 'Process access is not allowed' },
  { pattern: /\b__proto__\b/, reason: 'Prototype manipulation is not allowed' },
];

function scanCode(code) {
  const violations = [];
  const lines = code.split('\n');

  for (const banned of BANNED_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (banned.pattern.test(lines[i])) {
        violations.push({
          reason: banned.reason,
          line: i + 1,
          content: lines[i].trim()
        });
      }
    }
  }

  if (violations.length === 0) {
    return { safe: true };
  }

  return { safe: false, violations: violations };
}

// Expose globally for popup.js
window.LeetCrackSecurity = { scanCode };
