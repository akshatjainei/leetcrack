// LeetCrack - Settings Page Controller
// Manages API key storage and model selection via chrome.storage.local

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const toggleKeyBtn = document.getElementById('toggle-key-btn');
  const modelSelect = document.getElementById('model-select');
  const saveBtn = document.getElementById('save-btn');
  const testBtn = document.getElementById('test-btn');
  const statusToast = document.getElementById('status-toast');

  // Load saved settings on page open
  chrome.storage.local.get(['openai_api_key', 'openai_model'], (result) => {
    if (result.openai_api_key) {
      apiKeyInput.value = result.openai_api_key;
    }
    if (result.openai_model) {
      modelSelect.value = result.openai_model;
    }
  });

  // Toggle API key visibility
  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;

    if (!apiKey) {
      showToast('Please enter an API key', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showToast('API key should start with "sk-"', 'error');
      return;
    }

    chrome.storage.local.set({
      openai_api_key: apiKey,
      openai_model: model
    }, () => {
      showToast('Settings saved', 'success');
    });
  });

  // Test API connection with a lightweight models list call
  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showToast('Enter an API key first', 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        showToast('Connection successful — API key is valid', 'success');
      } else if (response.status === 401) {
        showToast('Invalid API key', 'error');
      } else {
        showToast(`API error: ${response.status} ${response.statusText}`, 'error');
      }
    } catch (err) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  });

  function showToast(message, type) {
    statusToast.textContent = message;
    statusToast.className = type;
    statusToast.hidden = false;

    setTimeout(() => {
      statusToast.hidden = true;
    }, 4000);
  }
});
