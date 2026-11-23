# Boxing Training App

A phone-sized boxing training app: plans and 8-week programmes, an animated demo boxer for every move, a round timer with a voice coach, and progress tracking. It's written in plain HTML, CSS and JavaScript, so there's nothing to install and no build step.

## Run it

**Quickest:** double-click `index.html`. It opens in your browser and works straight away.

**In VS Code (recommended, refreshes as you edit):**
1. In VS Code choose **File › Open Folder…** and pick this `BoxingApp` folder.
2. Open the Extensions panel (Ctrl+Shift+X), search for **Live Server** by Ritwick Dey and click Install. You only need to do this once.
3. Right-click `index.html` and choose **Open with Live Server**. The page reloads every time you save a file.

**On your phone:** with Live Server running, open the address it shows on your phone's browser, but swap `127.0.0.1` for your PC's IP address (run `ipconfig` in a terminal and look for "IPv4 Address"). The phone and PC must be on the same Wi-Fi.

Best in Chrome or Edge, which have the most natural voices for the coach. Use the browser's phone view to see the real size: press F12, then Ctrl+Shift+M.

## What's where

| File | What it does |
| --- | --- |
| `index.html` | The page and the bottom menu bar |
| `css/styles.css` | Colours, fonts and layout. Change the colours at the top under `:root` |
| `js/data.js` | **All the content**: moves and coaching points, combinations, plans and the week-by-week sessions. Edit this to change the training |
| `js/figure.js` | The animated boxer (a 3D skeleton drawn in SVG) |
| `js/coach.js` | The voice coach (your device's built-in text-to-speech) |
| `js/store.js` | Saves your sessions and settings in the browser, and builds sessions from plans |
| `js/app.js` | Every screen, navigation and the round timer |
| `js/trainer.js` | The Trainer tab: coach plans and logs sessions, releases them to the boxer, boxer adds comments |

## Things to try

- **Progress → "Load sample data"** fills in 3 weeks of training so you can see the charts. "Clear all my data" at the bottom wipes it.
- **Plans → pick one → "Start this plan this week"** puts it on the Today screen.
- **Timer → Timer and voice settings** changes the round length (2 or 3 min), the rest (30 s or 1 min) and the coach's voice.

Your data is saved in the browser you use. It stays on your computer, but it isn't shared between browsers or devices.
