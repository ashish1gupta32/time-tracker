# Website Time Tracker Chrome Extension ⏳

A lightweight, premium-styled Chrome Extension to track your daily website usage. Built with privacy in mind.

## Features ✨

-   **Smart Tracking**: Tracks time only when the tab is active. Pauses when you switch tabs, minimize Chrome, or go idle.
-   **Daily & Weekly Stats**: Toggle between today's view and the last 7 days.
-   **Visual Dashboard**: Beautiful "Glassmorphism" UI with dark mode.
-   **Favicon Support**: Uses Chrome's MV3 favicon API to show real website icons.
-   **Privacy First**: All data is stored locally in `chrome.storage.local`. Nothing leaves your device.
-   **Expandable History**: View top 5 sites or expand to see your full browsing history.

## Installation 🛠️

1.  Clone this repository or download the source code.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing this repository.
6.  Pin the extension to your toolbar and start tracking!

## Tech Stack 💻

-   **HTML5 & CSS3** (Variables, Flexbox, Custom Gradients)
-   **Vanilla JavaScript** (ES6+)
-   **Chrome Extension Manifest V3**
    -   `storage` API
    -   `tabs` API
    -   `idle` API
    -   `favicon` permission

## License 📄

This project is for personal use and educational purposes.
