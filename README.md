# KairosV2 Project Setup Guide

> A step-by-step setup guide for developers working on the **KairosV2** Google Docs Add-on.

**Repository:** [SchoolFuel/KairosV2](https://github.com/SchoolFuel/KairosV2)

---

## 0. Prerequisites

Before you begin, ensure you have the following installed:

- [**Git**](https://git-scm.com/downloads)
- [**Node.js (LTS version recommended)**](https://nodejs.org/)
- [**Yarn** (optional, but recommended for macOS/Linux)](https://classic.yarnpkg.com/lang/en/docs/install/)
- A **Google Account** with access to **Google Docs** and **Google Apps Script**
- Access to the **KairosV2 repository**

### ⚠️ Google Account Note
This project uses `Session.getActiveUser()`.  
That means you must use **one dedicated Google profile** per project.

- Use **only one Google account per Chrome profile**
- Each Google Doc should be linked to **one Google account only**
- Avoid opening Docs linked to another Google profile

This ensures the correct account is recognized and prevents authentication conflicts.

---

## 1. Fork the Repository

1. Visit the repository: [SchoolFuel/KairosV2](https://github.com/SchoolFuel/KairosV2)
2. Click **Fork** in the top-right corner

---

## 2. Clone Your Fork

Once forked, clone your repository locally:

```bash
git clone https://github.com/<your-username>/KairosV2
```
Then navigate into the project:

```bash
cd KairosV2
```
## 3. Create a Google Doc & Link Apps Script
Open Google Docs and create a new blank document

From the menu bar, go to
Extensions → Apps Script to open the script editor

## 4. Configure .clasp.json
In the root directory of your cloned project, create a file named .clasp.json and add the following:

```json
{
  "scriptId": "<your-script-id>",
  "rootDir": "",
  "scriptExtensions": [".js", ".gs"],
  "htmlExtensions": [".html"],
  "jsonExtensions": [".json"],
  "filePushOrder": [],
  "skipSubdirectories": false
}
```
🔍 How to Find Your Script ID
Open your Apps Script project

Click Project Settings (⚙️ icon)

Under IDs, copy the Script ID

Paste it into .clasp.json

## 5. Install Client Dependencies
Install dependencies for both sidebar-client and dialog-client:

macOS/Linux:
```bash
yarn install
```
Windows:
```bash
npm install
```
⚠️ Make sure Node.js is installed before running these commands.

## 6. Install clasp
Install clasp (the Google Apps Script CLI) globally:
```bash
npm install -g @google/clasp
```
Then enable the Google Apps Script API here:
👉 [Google Apps Script API](https://script.google.com/home/usersettings)

## 7. Authenticate clasp
Run the following:
```bash
clasp login
```
This opens a browser window for Google authentication.

🧠 Use the same Google account that owns the Google Doc you created in Step 3.
Avoid being logged into multiple Google accounts in the same browser profile.

## 8. Deploy the Application
From your project root, run:

```bash
npm run deploy
```
You should see output similar to:

```css
✅ Sidebar.html updated from React build.
✅ Dialog.html updated from React build.
Pushed 6 files.
└─ appsscript.json
└─ Code.js
└─ Dialog.html
└─ Sidebar.html
└─ Student.js
└─ Teacher.js
```
⚠️ Verify that your .clasp.json file contains the correct Script ID before deploying.

🛠️ Common Issue
If you see this error:

```bash
'vite' is not recognized as an internal or external command
```
Run the following inside both sidebar-client and dialog-client folders:

```bash
rm -rf node_modules
npm install
```
Then try deploying again.

## 9. Open & Test the Add-on
Open your Google Doc

Ensure you’re using the same Chrome profile tied to the Google account used earlier

Navigate to the `Kairos` on the top to launch and test the app.

⚠️ Avoid multiple Google accounts in the same Chrome profile — this may cause authentication issues.

## Troubleshooting Tips
Vite not found: Run npm install inside each client folder

Authentication errors: Make sure only one Google account is logged in per Chrome profile

Deployment not updating: Double-check your .clasp.json Script ID and rootDir path


## 👩‍💻 Contributors
SchoolFuel Team
KairosV2 © SchoolFuel — All Rights Reserved
