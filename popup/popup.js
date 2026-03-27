// LeetCrack - Popup Controller
// Handles UI events, communicates with background service worker and sandbox iframe

document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const runBtn = document.getElementById('run-btn');
  const pseudocodeInput = document.getElementById('pseudocode-input');
  const resultSection = document.getElementById('result-section');
  const executionOutput = document.getElementById('execution-output');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const errorBar = document.getElementById('error-bar');
  const sandboxFrame = document.getElementById('sandbox-frame');

  const noKeyNotice = document.getElementById('no-key-notice');
  const openSettingsLink = document.getElementById('open-settings-link');

  function openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
  }

  // --- Settings button ---
  settingsBtn.addEventListener('click', openSettings);
  openSettingsLink.addEventListener('click', openSettings);

  // --- Check for API key on load ---
  chrome.storage.local.get(['openai_api_key'], (result) => {
    if (!result.openai_api_key) {
      noKeyNotice.hidden = false;
    }
  });

  // --- Auto-fill from context menu selection ---
  chrome.storage.local.get(['contextMenuText'], (result) => {
    if (result.contextMenuText) {
      pseudocodeInput.value = result.contextMenuText;
      chrome.storage.local.remove('contextMenuText');
      // Auto-run after a short delay to let the sandbox iframe load
      setTimeout(() => runBtn.click(), 300);
    }
  });

  // --- Run button: convert pseudocode then execute automatically ---
  let executionResolver = null;
  const EXECUTION_TIMEOUT_MS = 5000;

  // Listen for results from the sandbox iframe
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'result' && executionResolver) {
      executionResolver(event.data);
      executionResolver = null;
    }
  });

  runBtn.addEventListener('click', async () => {
    const pseudocode = pseudocodeInput.value.trim();

    if (pseudocode.length < 10) {
      showError('Please enter more detailed pseudocode (at least 10 characters).');
      return;
    }

    hideError();
    resultSection.hidden = true;
    showLoading('Generating output...');
    runBtn.disabled = true;

    try {
      // Step 1: Convert pseudocode to code via AI
      const response = await chrome.runtime.sendMessage({
        action: 'convert',
        pseudocode: pseudocode
      });

      if (!response.success) {
        showError(response.error);
        return;
      }

      const code = response.code;
      noKeyNotice.hidden = true;

      // Step 2: Security scan
      const scan = window.LeetCrackSecurity.scanCode(code);
      if (!scan.safe) {
        const details = scan.violations.map(v => `Line ${v.line}: ${v.reason}`).join('\n');
        showError('Security scan failed:\n' + details);
        return;
      }

      // Step 3: Execute in sandbox
      showLoading('Running...');
      const result = await executeInSandbox(code);

      resultSection.hidden = false;

      if (result.success) {
        let output = '';
        if (result.logs && result.logs.length > 0) {
          output += result.logs.join('\n');
        }
        if (result.returnValue) {
          output += (output ? '\n\n' : '') + '=> ' + result.returnValue;
        }
        executionOutput.textContent = output || '(no output)';
      } else {
        executionOutput.textContent = 'Error: ' + result.error +
          (result.logs && result.logs.length > 0 ? '\n\nPartial output:\n' + result.logs.join('\n') : '');
      }
    } catch (err) {
      resultSection.hidden = false;
      executionOutput.textContent = 'Error: ' + err.message;
    } finally {
      hideLoading();
      runBtn.disabled = false;
    }
  });

  function executeInSandbox(code) {
    return new Promise((resolve, reject) => {
      executionResolver = resolve;

      sandboxFrame.contentWindow.postMessage(
        { action: 'execute', code: code }, '*'
      );

      // Timeout — destroy and recreate iframe if code hangs
      setTimeout(() => {
        if (executionResolver) {
          executionResolver = null;
          const src = sandboxFrame.src;
          sandboxFrame.src = '';
          sandboxFrame.src = src;
          reject(new Error('Execution timed out (5s limit). Possible infinite loop.'));
        }
      }, EXECUTION_TIMEOUT_MS);
    });
  }

  // --- Helper functions ---
  function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.hidden = false;
  }

  function hideLoading() {
    loadingOverlay.hidden = true;
  }

  function showError(message) {
    errorBar.innerHTML = '';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', hideError);
    errorBar.appendChild(closeBtn);
    errorBar.appendChild(document.createTextNode(message));
    errorBar.hidden = false;
  }

  function hideError() {
    errorBar.hidden = true;
  }

  // --- Keyboard shortcut: Ctrl/Cmd+Enter to run ---
  pseudocodeInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runBtn.click();
    }
  });
});
