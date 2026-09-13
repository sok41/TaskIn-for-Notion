# TaskIn for Notion

**English** | [日本語](./README.ja.md)

A Windows tray app that captures a task straight into Notion in seconds. Press a hotkey (default: `Ctrl+Alt+N`), a small popup appears, type a task name (and an optional due date), and it's added as a new page in your Notion database — no need to open Notion at all.

## Features

- One hotkey opens an input popup; enter a task name and due date and it's saved to Notion
- Due dates via "Today" / "Tomorrow" quick-pick buttons, or typed directly as `YYYY-MM-DD`
- "Keep adding tasks" toggle: leave the popup open after each save to add several tasks in a row
- Runs in the background from the system tray
- Launch at Windows startup, switchable UI language (日本語 / English)
- In-app "Check for updates" button that checks GitHub Releases for a newer version

## Install

Download the latest installer (`.exe` or `.msi`) from [GitHub Releases](https://github.com/sok41/TaskIn-for-Notion/releases/latest) and run it. The app will notify you of future updates from its Settings window (see [Updates](#updates) below).

### Building from source

Prerequisites: Node.js, Rust (`rustup`), Windows C++ build tools (the "Desktop development with C++" workload from Visual Studio Build Tools), and the WebView2 runtime.

```bash
npm install
npm run tauri dev
```

To build your own installer:

```bash
npm run tauri build
```

The installers are written to `src-tauri/target/release/bundle/`.

## First-time setup

On first launch (or whenever Notion isn't connected yet), the settings window opens automatically. Follow these steps to connect it to Notion:

1. **Create a Notion integration**
   Open [Notion's "My integrations"](https://www.notion.so/my-integrations) and create a new one. Copy the "Internal Integration Secret" it shows you (starts with `secret_...` or `ntn_...`).

2. **Share your database with the integration**
   Open the Notion database you want tasks added to, then from the "•••" menu in the top right, choose "Connect to" and select the integration you just created.

3. **Copy the database URL**
   Copy it from your browser's address bar, or via the database's "•••" → "Copy link".

4. **Fill in the app's settings window**
   - Paste the secret from step 1 into `Integration Token`
   - Paste the URL from step 3 into `Database URL`, then press "Test connection / detect properties"
     - On success, the title and due-date properties to use are detected automatically
   - Optionally change the `Hotkey`, display language, or autostart setting
   - Press "Save"

## Usage

1. Press the hotkey (default: `Ctrl+Alt+N`) from anywhere
2. Type a task name in the popup (required)
3. Optionally set a due date
   - Use the "Today" / "Tomorrow" buttons, or type one directly as `YYYY-MM-DD`
4. Press `Enter`, or click "Add"
5. On success, a green message appears and the window closes automatically after 1–2 seconds
   - Turn on "Keep adding tasks" to leave the window open after each save, with the fields cleared, so you can add several tasks in a row (off by default)
   - On failure, a red error message appears and the window stays open so you can fix and retry
6. Press `Esc` at any time to close the window

### System tray menu

Right-click the tray icon in the notification area for:

- **New Task**: opens the input popup, same as the hotkey
- **Settings**: opens the settings window
- **Quit**: exits the app completely

The settings window and popup are only hidden when closed with their close button — the app keeps running in the tray.

## Settings

| Setting | Description |
|---|---|
| Language | Switch between 日本語 and English |
| Integration Token | Your Notion integration's secret key |
| Database URL | The target database's URL (its ID is extracted automatically) |
| Hotkey | The key combination that opens the input popup (default: `Ctrl+Alt+N`) |
| Launch automatically when Windows starts | When on, the app starts automatically at Windows login |
| Check for updates | Checks GitHub Releases and reports whether a newer version is available |

## Updates

Press "Check for updates" in Settings at any time to compare your installed version against the [latest GitHub Release](https://github.com/sok41/TaskIn-for-Notion/releases/latest). If a newer version is available, it links you straight to the download page.

## Notes

- Saved credentials (Integration Token, etc.) are currently **stored locally in plain text**, since this is built for personal use (a switch to encrypted storage, e.g. Windows Credential Manager, is planned before any wider distribution).
- The target Notion database is fixed to one (there's no support for choosing among multiple databases, or for editing/deleting tasks from the app).
