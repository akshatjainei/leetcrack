// LeetCrack - Popup Controller
// Handles UI events, communicates with background service worker and sandbox iframe

document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const convertBtn = document.getElementById('convert-btn');
  const pseudocodeInput = document.getElementById('pseudocode-input');
  const codeSection = document.getElementById('code-section');
  const codeOutput = document.getElementById('code-output');
  const copyBtn = document.getElementById('copy-btn');
  const runBtn = document.getElementById('run-btn');
  const securityStatus = document.getElementById('security-status');
  const resultSection = document.getElementById('result-section');
  const executionOutput = document.getElementById('execution-output');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const errorBar = document.getElementById('error-bar');
  const sandboxFrame = document.getElementById('sandbox-frame');

  // Settings button -> open settings page
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
  });

  // TODO: Phase 3 - Convert button logic
  // TODO: Phase 4 - Run button logic, security scan, sandbox communication
});
