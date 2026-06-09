# 🌸 Chiikawa Desktop Pet

A cute productivity desktop app featuring Chiikawa, Hachiware, Usagi, Momonga, and Mimikyu!

## Features
- 🍅 **Pomodoro Timer** — customizable focus/break/long break sessions
- 🔔 **Reminders** — set date/time reminders with system notifications
- 📅 **Calendar** — monthly view with per-day events
- 📝 **Notes / To-do** — checklist with persistent storage
- 🐾 **Pet reactions** — your pet reacts to every action!

---

## Setup (Windows)

### Requirements
- [Node.js](https://nodejs.org/) (v18 or higher)

### Steps

1. **Install dependencies**
   Open a terminal in this folder and run:
   ```
   npm install
   ```

2. **Run the app**
   ```
   npm start
   ```

3. **Build a .exe installer** (optional)
   ```
   npm run build
   ```
   The installer will appear in the `dist/` folder.

4. **Build a portable .exe** (no install needed)
   ```
   npm run dist
   ```

---

## Tips
- The app saves all your data automatically (notes, reminders, calendar events)
- Click the **green button** to hide to system tray — it keeps running in the background!
- Click the **yellow button** to minimize
- Right-click the tray icon to show/quit

## Notes
- First `npm install` may take a minute — it downloads Electron (~80MB)
- Building the .exe requires internet for the first time
