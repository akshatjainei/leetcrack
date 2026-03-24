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

  // --- Settings button ---
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
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

  // TODO: Phase 4 - Run button logic, security scan, sandbox communication

  // --- Helper functions ---
  function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.hidden = false;
  }

  function hideLoading() {
    loadingOverlay.hidden = true;
  }

  function showError(message) {
    errorBar.textContent = message;
    errorBar.hidden = false;
  }

  function hideError() {
    errorBar.hidden = true;
  }
});
