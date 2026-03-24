# LeetCrack

Chrome extension that converts pseudocode into executable JavaScript using AI, then runs it safely in the browser.

## Features

- **Pseudocode to JS** — Write informal algorithm descriptions and get clean, runnable JavaScript
- **Sandboxed execution** — Generated code runs in a secure Chrome sandbox with no network/DOM/storage access
- **4-layer security** — Prompt engineering + static analysis + sandboxed iframe + execution timeout
- **Editable output** — Tweak the generated code before running
- **Dark theme** — Clean UI that matches coding environments

## Setup

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder
5. Click the LeetCrack extension icon
6. Open **Settings** (gear icon) and add your OpenAI API key

## Usage

1. Type pseudocode in the input area (e.g., "binary search on sorted array")
2. Click **Convert to JavaScript** (or `Ctrl/Cmd+Enter`)
3. Review and optionally edit the generated code
4. Click **Run Code** (or `Ctrl/Cmd+Enter` in the code area)
5. See the output below

## Security

All generated code is scanned for dangerous patterns and executed in a Chrome sandboxed iframe with:
- No access to Chrome APIs
- No network requests
- No DOM or storage access
- 5-second execution timeout

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript (no framework, no bundler)
- OpenAI Chat Completions API
