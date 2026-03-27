// LeetCrack - Background Service Worker
// Handles OpenAI API calls and communicates with the popup

importScripts('../lib/prompt.js');

console.log('LeetCrack service worker loaded');

// --- Context menu: right-click selected text to generate output ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'leetcrack-generate',
    title: 'Generate output with LeetCrack',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'leetcrack-generate' && info.selectionText) {
    await chrome.storage.local.set({ contextMenuText: info.selectionText });
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convert') {
    handleConvert(message.pseudocode)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    // Return true to indicate async response
    return true;
  }
});

async function handleConvert(pseudocode) {
  // Read API key and model from storage
  const settings = await chrome.storage.local.get(['openai_api_key', 'openai_model']);

  if (!settings.openai_api_key) {
    return { success: false, error: 'No API key set. Open Settings to add your OpenAI API key.' };
  }

  const model = settings.openai_model || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openai_api_key}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(pseudocode) }
      ],
      temperature: 0.2,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, error: 'Invalid API key. Check your key in Settings.' };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limited by OpenAI. Wait a moment and try again.' };
    }
    return { success: false, error: `OpenAI API error: ${response.status} ${response.statusText}` };
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  if (rawContent.trim() === 'INVALID_INPUT') {
    return { success: false, error: 'Invalid input. Please provide pseudocode or an algorithm description.' };
  }

  // Extract code from markdown code fence
  const code = extractCode(rawContent);

  if (!code) {
    return { success: false, error: 'Could not extract code from the AI response.', rawResponse: rawContent };
  }

  return { success: true, code: code, rawResponse: rawContent };
}

function extractCode(text) {
  // Match ```javascript ... ``` or ```js ... ``` or bare ``` ... ```
  const match = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }

  // Fallback: if the response looks like code (has function/const/let), use it as-is
  if (/\b(function|const|let|var)\b/.test(text)) {
    return text.trim();
  }

  return null;
}
