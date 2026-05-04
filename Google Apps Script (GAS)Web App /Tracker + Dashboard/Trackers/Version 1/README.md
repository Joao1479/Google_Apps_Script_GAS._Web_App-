# ⏱️ Productivity Tracker Dashboard - User Manual

## 🎯 What is this application?

This application is a dynamic **Productivity Dashboard** built entirely to work within the Google ecosystem (Google Apps Script).

Its primary purpose is to surgically manage and monitor your daily working time, track progress across various task "Queues", and mathematically predict whether your working Pace is ahead or behind relative to the time you've actually worked today. It features direct (both manual and autonomous) synchronization to a centralized Google Sheets document.

---

## 🚀 Core Features and How to Use Them

### 1. Timers
The application features three isolated main timers (only one runs at a time to maintain accurate metrics). **(Smart Sleep Resistance: These timers calculate absolute time deltas, meaning if your computer goes to sleep or standby, the elapsed time is properly preserved and added back when you return)**.
* **Case Work:** Time strictly dedicated to focused work on queues/tickets/cases. This timer feeds the volume goals.
* **Vertical Training (VT):** Time dedicated to training, coaching, or reading.
* **Break:** Time for pauses and breaks.
* **How to use:** Click the "Start" (▶️) button to toggle or transition between timers. Click "Pause" (⏸️) to stop them all at once.
* **✏️ Manual Correction:** Forgot to start a timer on time? Click the **small pencil icon** (top right corner of the respective black card) to open the quick edit modal. Here, you can directly adjust the current Hours, Minutes, and Seconds without losing your metrics.

### 2. Queue Management and Counting
* **Adding Tasks:** Click the main gear icon (⚙️ *Dashboard Settings*) at the top and go to "Manage Queues" to create new work queues, assigning a Name and a daily Goal of items.
* **Tracking Progress:** In the main central table, use the wide blue buttons with `-` and `+` (or type the number directly into the middle input box) to log what you've completed in real-time. The blue progress bar will smoothly fill up as you approach 100%.
* **(Reset):** The red button in the header ("Reset Counts") allows you to zero out the daily counts in the table. (This has a built-in safety system: it requires two clicks within a few seconds to prevent accidental data loss).

### 3. Daily Summary Cards
* **Vertical Training (Week):** A view of your current weekly goal. This data doesn't live in a vacuum: this area is read directly from the sum of the "VT Time Logged" inserted in your Google Sheets "Vertical Training" tab.
* **Overall Progress:** A direct, raw sum (`X.XX%`) of the total percentages already completed across all *Queues* you are assigned to today. It displays alongside the total global number of "Cases" closed today.
* **Pace Status:** A "smart" calculation of your Pace! This feature processes the total percentage of items already handled ("Overall Progress") versus *the time you've had the 'Case Work' timer running*, calculating if you've done a lot in a short time or vice versa. It will respond with precision:
* 🟢 **Ahead:** You are working faster than expected. It translates this into a Time Buffer bonus (e.g., you were so productive you accumulated an extra `+01:15:00`).
* 🔴 **Behind:** You are falling behind! It translates this into the actual real hours/minutes you need to catch up (e.g., `-00:45:00`).
* 🔵 **On Pace:** Impeccable and balanced pace compared to the expectation.

### 4. Synchronization to Google Sheets (Overall Progress)
Your progress is strictly structured into a fixed **Overall Progress** tab tracking 1 row per day, ensuring scalability for years of cleanly formatted logs.
The sync captures all timers, goals, counts, and your dynamically computed **Daily AHT** (Average Handle Time calculated by your 'Case Work' divided by closed volume).
It syncs via a triple-layered safety approach (Local Cache, Manual Cloud Sync, Autonomous Cloud Sync):
* **Manual Synchronization:** Force data injection into Google Sheets (for supervisors or daily logs) by clicking the **Cloud button with arrows 🔃**.
* **Automatic Synchronization:** Runs protectively and invisibly in the background:
1. Saves hourly (exactly at the 30-minute mark, e.g., X:30).
2. Saves when you switch tabs or navigate away.
3. Attempts a mass sync of final data right when you try to close the browser tab.

### 5. Detailed Logging and History (Extra Actions)
* **History Chart (📊):** In the header, access an interactive chart (Chart.js) that downloads and displays your successfully completed global productivity over the last 7 days. Perfect for measuring trends.
* **Detailed Log Box:** In the bottom left corner, a dedicated area ("Log Individual Item") allows you to explicitly scan/type unique case IDs and attach a comment. This injects a single row directly into the clean "Detailed Logs" section of your Sheets with a timestamp. Ideal for escalation.

---

> Designed to maximize workflow with zero friction. All cards, progression colors, and interfaces react to clicks in milliseconds. Keep your timers honest so the "Pace Status" math can be your greatest daily advisor!
