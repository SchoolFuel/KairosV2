
# 🚀 Kairos V2 Onboarding Guide

Welcome to **Kairos V2** – a collaborative Google Apps Script project now managed via **Git**. This guide helps you get started with setting up the project, contributing, and collaborating with the team.

---

## 📂 Repository Link

👉 [https://github.com/yadvendranaveen/KairosV2](https://github.com/yadvendranaveen/KairosV2)

---

## ✅ Prerequisites

- [Git](https://git-scm.com/downloads) installed
- GitHub account
- (Optional) Access permissions from contributors for pushing changes (currently public repo)

---

## 👥 Contributors

To request contributor access (write permissions), contact:

- **@mhv2408** – Venkata Sai Harsha Vardhan  
- **@venkatasai7** – Venkata Sai Kuniganti

(See contributor list in the GitHub repo)

---

## 🧭 Getting Started

1. **Clone the Repository**

Using SSH:
```bash
git clone git@github.com:venkatasai7/KairosV2.git
```

Using HTTPS:
```bash
git clone https://github.com/venkatasai7/KairosV2.git
```

2. **Navigate into the Project**
```bash
cd KairosV2
```

3. **Set Up .clasp.json Configuration**

Create a `.clasp.json` file in the root directory of the project with the following template:

```json
{
    "scriptId": "<scriptId>",
    "rootDir": "<repoRoot>",
    "scriptExtensions": [".js", ".gs"],
    "htmlExtensions": [".html"],
    "jsonExtensions": [".json"],
    "filePushOrder": [],
    "skipSubdirectories": false
}
```

**To get your script ID:**
1. Create a personal Google Doc in your Google Drive
2. Go to **Extensions** → **Apps Script** in the document
3. Go to Settings->Script Id (copy)
4. Replace `<scriptId>` with your actual script ID
5. Replace `<repoRoot>` with the path to your repository root (usually just `"."`)

4. **Create a Feature Branch**
```bash
git checkout -b your-feature-name
```

5. **Make Your Changes Locally**

Edit using your preferred IDE or the Google Apps Script online editor.

6. **Stage, Commit, and Push Changes**
```bash
git add .
git commit -m "Add: your change summary"
git push origin your-feature-name
```

7. **Open a Pull Request** on GitHub for review and merge.

---

## 🔄 Sync with Main Branch

Before pushing or starting a new feature:
```bash
git checkout main
git pull origin main
```

---

## 🗂️ Access the Production Document

You must have edit access to the following Google Doc:

**Kairos Project (Production)**  
🔗 https://docs.google.com/document/d/1LygbPOaU-570iMOOlALU2KKktCjoC2uL41c3lDqIHAU/edit?usp=sharing

To gain access, you may request it from any of the following:  
`gbroberg@schoolfuel.org`, `broberggreg@gmail.com`, `vmirthin@asu.edu`, `snazer@asu.edu`, `raja.asileti2usa@gmail.com`, `devuser@schoolfuel.org`

---

## ⚠️ Notes

- **Do not push directly to `main`** unless you’re authorized.
- Follow proper Git hygiene: pull before coding, branch off `main`, use meaningful commit messages, and open PRs for all changes.

---

---

## 🚀 Deployment Strategy

This project uses a **hybrid trunk-based deployment** approach with manual deployment processes.

### **Branch Strategy**
- **`main`**: Production-ready code, deployed to production
- **`staging`**: Integration testing branch, deployed to staging environment
- **Feature branches**: Short-lived branches for development

### **Deployment Flow**
```
Branch:Feature: Branch → staging → main 
                 ↓          ↓        ↓     
Use Case:       Develop   Test/QA   Deploy  
```

### **Manual Deployment Process**

#### **Development Workflow**
1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

3. **Merge to staging for testing**
   ```bash
   git checkout staging
   git merge feature/new-feature
   git push origin staging
   ```

4. **Build app - this generates a new KairosV2/Sidebar.html file**
   ```
   cd client && npm run build
   ```

5. **Deploy to staging environment**
   ```bash
   # Install clasp globally
   npm install -g @google/clasp
   
   # Login to clasp
   clasp login
   
   # Modify .clasp.json scriptId to the production document script Id
   In .clasp.json - make sure you have production document script id
   # Push to Apps Script
   clasp push
   
   # Deploy to create new version
   clasp deploy
   ```

5. **Create Pull Request for Production Release**
   - Create a PR from `staging` to `main`
   - **PR Title**: `Release <date>` (e.g., "Release 2024-01-15")
   - **Requirement**: At least one approval required before merge
   - After approval, merge the PR to `main`

6. **Deploy to production**
   ```bash
   git checkout main
   git pull origin main
   cd client && npm run build # this generates a new KairosV2/Sidebar.html file
   clasp push  # In .clasp.json- make sure you have production document script id
   clasp deploy
   ```
---
---

Happy coding! 🎉
