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

  // --- Convert button ---
  convertBtn.addEventListener('click', async () => {
    const pseudocode = pseudocodeInput.value.trim();

    if (pseudocode.length < 10) {
      showError('Please enter more detailed pseudocode (at least 10 characters).');
      return;
    }

    hideError();
    showLoading('Converting pseudocode...');
    convertBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'convert',
        pseudocode: pseudocode
      });

      if (response.success) {
        codeOutput.value = response.code;
        codeSection.hidden = false;
        resultSection.hidden = true;
        noKeyNotice.hidden = true;
        securityStatus.textContent = '';
        securityStatus.className = '';
      } else {
        showError(response.error);
      }
    } catch (err) {
      showError('Failed to communicate with background service. Try reloading the extension.');
    } finally {
      hideLoading();
      convertBtn.disabled = false;
    }
  });

  // --- Copy button ---
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeOutput.value).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });

  // --- Run button ---
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
    const code = codeOutput.value.trim();
    if (!code) return;

    hideError();

    // Layer 2: Static security scan
    const scan = window.LeetCrackSecurity.scanCode(code);
    if (!scan.safe) {
      securityStatus.textContent = 'Blocked';
      securityStatus.className = 'unsafe';
      const details = scan.violations.map(v => `Line ${v.line}: ${v.reason}`).join('\n');
      showError('Security scan failed:\n' + details);
      return;
    }

    securityStatus.textContent = 'Passed';
    securityStatus.className = 'safe';
    showLoading('Running code...');
    runBtn.disabled = true;

    try {
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

      // Layer 4: Timeout — destroy and recreate iframe if code hangs
      setTimeout(() => {
        if (executionResolver) {
          executionResolver = null;
          // Destroy the hung iframe and recreate it
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

  // --- Keyboard shortcut: Ctrl/Cmd+Enter to convert ---
  pseudocodeInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      convertBtn.click();
    }
  });

  // --- Keyboard shortcut: Ctrl/Cmd+Enter in code area to run ---
  codeOutput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runBtn.click();
    }
  });
});
