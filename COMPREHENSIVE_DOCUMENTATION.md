# KairosV2 - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Frontend-Backend Communication](#frontend-backend-communication)
5. [Key Components](#key-components)
6. [Data Flow](#data-flow)
7. [Backend API Integration](#backend-api-integration)
8. [Build & Deployment](#build--deployment)
9. [Development Workflow](#development-workflow)
10. [Common Patterns](#common-patterns)

---

## Project Overview

**KairosV2** is a Google Docs Add-on built with React and Google Apps Script that provides personalized learning tools for students and project management tools for teachers. The application integrates with an AWS Lambda backend API for data persistence and AI services.

### Key Features
- **Student Features:**
  - Create and manage projects with stages, tasks, and gate assessments
  - AI-powered guidance and advice
  - Morning pulse check-ins
  - Learning standards integration
  - Expert finder

- **Teacher Features:**
  - Project queue for reviewing student submissions
  - Gate assessment workflow
  - Project approval/revision system
  - Analytics and scheduling tools

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Google Docs UI                       │
│  ┌──────────────┐              ┌──────────────┐        │
│  │   Sidebar     │              │    Dialog    │        │
│  │  (React App) │              │  (React App) │        │
│  └──────┬───────┘              └──────┬───────┘        │
└─────────┼────────────────────────────┼─────────────────┘
          │                             │
          │  google.script.run          │
          │                             │
┌─────────▼─────────────────────────────▼─────────────────┐
│         Google Apps Script (Backend)                     │
│  ┌──────────────┐              ┌──────────────┐         │
│  │  Student.js  │              │  Teacher.js  │         │
│  │  Code.js     │              │              │         │
│  └──────┬───────┘              └──────┬───────┘         │
└─────────┼────────────────────────────┼─────────────────┘
          │                             │
          │  HTTP Requests (UrlFetchApp)│
          │                             │
┌─────────▼─────────────────────────────▼─────────────────┐
│         AWS Lambda API                                  │
│  https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com│
│  /prod/invoke                                           │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with Hooks
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)

**Backend:**
- Google Apps Script (JavaScript)
- Google Apps Script HTML Service

**External Services:**
- AWS Lambda API Gateway
- Google Docs API
- Google Sheets API (for some features)

---

## Project Structure

```
KairosV2/
├── Code.js                    # Main Apps Script entry point
├── Student.js                 # Student-related backend functions
├── Teacher.js                 # Teacher-related backend functions
├── Sidebar.html               # Generated HTML for sidebar (from sidebar-client)
├── Dialog.html                # Generated HTML for dialogs (from dialog-client)
├── appsscript.json            # Apps Script configuration
│
├── sidebar-client/            # React app for sidebar
│   ├── src/
│   │   ├── App.jsx            # Main sidebar app (routing)
│   │   ├── components/
│   │   │   ├── Student/      # Student components
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── CreateProject/
│   │   │   │   ├── MyProjects/
│   │   │   │   ├── Advice/
│   │   │   │   ├── GuideMe/
│   │   │   │   └── ...
│   │   │   ├── Teacher/      # Teacher components
│   │   │   │   └── TeacherDashboard.jsx
│   │   │   └── Shared/       # Shared components
│   │   └── data/
│   └── package.json
│
├── dialog-client/             # React app for modal dialogs
│   ├── src/
│   │   ├── App.jsx           # Dialog router (hash-based)
│   │   ├── components/
│   │   │   ├── Student/
│   │   │   │   ├── CreateProject/
│   │   │   │   └── MyProjects/
│   │   │   ├── Teacher/
│   │   │   │   ├── TeacherProjectQueue.jsx
│   │   │   │   ├── GateAssessment.jsx
│   │   │   │   └── ReviewGateStandard.jsx
│   │   │   └── Shared/
│   └── package.json
│
└── package.json              # Root package.json (workspace config)
```

---

## Frontend-Backend Communication

### Communication Pattern

The frontend (React) communicates with the backend (Google Apps Script) using the `google.script.run` API.

### Basic Pattern

```javascript
// Frontend (React Component)
google.script.run
  .withSuccessHandler((response) => {
    // Handle successful response
    console.log(response);
  })
  .withFailureHandler((error) => {
    // Handle error
    console.error(error);
  })
  .functionName(param1, param2);  // Call Apps Script function
```

### Example: Loading Projects

**Frontend (TeacherProjectQueue.jsx):**
```javascript
const loadProjects = async () => {
  google.script.run
    .withSuccessHandler((response) => {
      // Parse response and update state
      setProjects(response.body.action_response.projects);
    })
    .withFailureHandler((error) => {
      setError(error.message);
    })
    .getTeacherProjectsAll();  // Calls function in Teacher.js
};
```

**Backend (Teacher.js):**
```javascript
function getTeacherProjectsAll() {
  const url = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const body = {
    action: "myprojects",
    payload: {
      request: "teacher_view_all",
      email_id: "teacher1@gmail.com",
      subject_domain: "Science",
    },
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  // Parse and return response
  const out = JSON.parse(res.getContentText());
  return { statusCode: 200, body: out.action_response };
}
```

### Dialog Opening Pattern

**Backend (Code.js):**
```javascript
function openDialog(dialogType, title) {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(900)
    .setHeight(700);
  
  // Set hash to route to specific dialog
  const htmlWithHash = html.getContent();
  const modifiedHtml = HtmlService.createHtmlOutput(
    htmlWithHash.replace('<body>', `<body><script>window.location.hash = '${dialogType}';</script>`)
  )
    .setWidth(900)
    .setHeight(700);
  
  DocumentApp.getUi().showModalDialog(modifiedHtml, title);
}
```

**Frontend (dialog-client/src/App.jsx):**
```javascript
useEffect(() => {
  // Get dialog type from URL hash
  const hash = window.location.hash.slice(1);
  if (hash && DIALOGS[hash]) {
    setDialogType(hash);
  }
}, []);
```

---

## Key Components

### Sidebar Components

#### 1. **App.jsx (Sidebar)**
- **Location:** `sidebar-client/src/App.jsx`
- **Purpose:** Main entry point for sidebar, handles authentication and routing
- **Key Features:**
  - Validates user on mount
  - Routes to StudentDashboard or TeacherDashboard based on role
  - Shows loader during authentication

#### 2. **StudentDashboard.jsx**
- **Location:** `sidebar-client/src/components/Student/StudentDashboard.jsx`
- **Purpose:** Main dashboard for students
- **Features:**
  - Collapsible sections for different tools
  - Navigation to various student features

#### 3. **TeacherDashboard.jsx**
- **Location:** `sidebar-client/src/components/Teacher/TeacherDashboard.jsx`
- **Purpose:** Main dashboard for teachers
- **Features:**
  - Buttons to open dialogs (Project Queue, Gate Assessment)

### Dialog Components

#### 1. **App.jsx (Dialog)**
- **Location:** `dialog-client/src/App.jsx`
- **Purpose:** Router for dialog components based on URL hash
- **Supported Routes:**
  - `student-standards`: Learning standards dialog
  - `create-project`: Create project dialog
  - `project-dashboard`: Project dashboard
  - `teacher-project-queue`: Teacher project queue
  - `add-standard`: Add standard dialog

#### 2. **TeacherProjectQueue.jsx**
- **Location:** `dialog-client/src/components/Teacher/TeacherProjectQueue.jsx`
- **Purpose:** Main component for teachers to review student projects
- **Key Features:**
  - Lists all projects submitted by students
  - Filter by status (all, pending)
  - Search functionality
  - Detailed project review modal
  - Stage-by-stage review with tabs
  - Gate standards review
  - Approve/reject functionality
  - Analytics tab
  - Calendar tab

**State Management:**
```javascript
const [projects, setProjects] = useState([]);
const [selectedProject, setSelectedProject] = useState(null);
const [projectDetails, setProjectDetails] = useState(null);
const [editableProjectData, setEditableProjectData] = useState(null);
const [isFrozen, setIsFrozen] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

**Key Functions:**
- `loadProjects()`: Fetches all projects via `getTeacherProjectsAll()`
- `handleReview(project)`: Opens detailed review modal
- `handleApprove(project)`: Approves a project
- `handleReject(project)`: Requests revision
- `handleSaveChanges()`: Saves edits to project data

#### 3. **ReviewGateStandard.jsx**
- **Location:** `dialog-client/src/components/Teacher/ReviewGateStandard .jsx`
- **Purpose:** Displays and allows editing of gate standards for a stage
- **Props:**
  - `gate`: Gate object with title, description, checklist
  - `isEditable`: Whether the component is editable
  - `isFrozen`: Whether changes are frozen (saved)
  - `onUpdate`: Callback to update gate data

**Structure:**
- Gate Title (editable input)
- Description (editable textarea)
- Checklist (numbered as "Stage 1", "Stage 2", etc.)

#### 4. **GateAssessment.jsx**
- **Location:** `dialog-client/src/components/Teacher/GateAssessment.jsx`
- **Purpose:** 6-step workflow for gate assessment planning
- **Steps:**
  1. Select Assessment
  2. Review Project and Mastery Standards
  3. Generate Materials
  4. Review Generated Materials
  5. Schedule Assessment
  6. Send Invite

---

## Data Flow

### Example: Teacher Reviewing a Project

```
1. User clicks "Review" on a project card
   ↓
2. TeacherProjectQueue.handleReview(project) called
   ↓
3. Sets selectedProject state
   ↓
4. Calls google.script.run.getTeacherProjectDetails(projectId, userId)
   ↓
5. Teacher.js.getTeacherProjectDetails() executes
   ↓
6. Makes HTTP request to AWS Lambda API
   POST https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke
   {
     action: "myprojects",
     payload: {
       project_id: "...",
       user_id: "...",
       request: "project_details"
     }
   }
   ↓
7. AWS Lambda processes request and returns project data
   ↓
8. Teacher.js parses response and returns to frontend
   ↓
9. Frontend receives response in withSuccessHandler
   ↓
10. Sets projectDetails and editableProjectData state
   ↓
11. Modal displays with project details, stages, tasks, gates
   ↓
12. User can edit fields (when not frozen)
   ↓
13. Changes tracked in editableProjectData
   ↓
14. User clicks "Save Changes"
   ↓
15. handleSaveChanges() called (currently logs, needs API integration)
   ↓
16. Sets isFrozen = true, hasUnsavedChanges = false
```

### Example: Loading All Projects

```
1. Component mounts → useEffect calls loadProjects()
   ↓
2. google.script.run.getTeacherProjectsAll() called
   ↓
3. Teacher.js.getTeacherProjectsAll() executes
   ↓
4. Makes HTTP request to AWS Lambda
   POST /prod/invoke
   {
     action: "myprojects",
     payload: {
       request: "teacher_view_all",
       email_id: "teacher1@gmail.com",
       subject_domain: "Science"
     }
   }
   ↓
5. AWS Lambda returns list of projects
   ↓
6. Response parsed in multiple paths (flexible parsing)
   ↓
7. Projects mapped to component format
   ↓
8. setProjects() updates state
   ↓
9. UI re-renders with project cards
```

---

## Backend API Integration

### API Endpoint

**Base URL:** `https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke`

### Request Format

All requests follow this structure:

```javascript
{
  action: "action_name",      // e.g., "myprojects", "advice", "guideme"
  payload: {
    // Action-specific payload
  }
}
```

### Common Actions

#### 1. **myprojects**
Used for project-related operations.

**Get All Teacher Projects:**
```javascript
{
  action: "myprojects",
  payload: {
    request: "teacher_view_all",
    email_id: "teacher1@gmail.com",
    subject_domain: "Science"
  }
}
```

**Get Project Details:**
```javascript
{
  action: "myprojects",
  payload: {
    project_id: "123",
    user_id: "456",
    email_id: "teacher1@gmail.com",
    request: "project_details"
  }
}
```

**Get Student Projects:**
```javascript
{
  action: "myprojects",
  payload: {
    user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
    request: "student_view_all"
  }
}
```

**Save Project:**
```javascript
{
  action: "saveproject",
  payload: {
    json: {
      project: projectData
    },
    user_id: "...",
    email_id: "..."
  }
}
```

#### 2. **advice**
Get AI-powered advice.

```javascript
{
  action: "advice",
  payload: {
    message: "I need help with...",
    email_id: "student@example.com"
  }
}
```

#### 3. **guideme**
AI guidance service.

**Initiation:**
```javascript
{
  action: "guideme",
  payload: {
    email_id: "...",
    message: "...",
    context: {
      mode: "...",
      focus: "...",
      course: "...",
      grade: "...",
      readingLevel: "...",
      standards: [...],
      pastedContent: "..."
    }
  }
}
```

**Continue Conversation:**
```javascript
{
  action: "guideme",
  payload: {
    email_id: "...",
    message: "...",
    conversation_id: "..."
  }
}
```

#### 4. **morningpulse**
Daily check-in.

```javascript
{
  action: "morningpulse",
  payload: {
    email_id: "...",
    emoji: "😊",
    route: "daily-checkin",
    message: "..."
  }
}
```

#### 5. **aboutme**
Submit about me information.

```javascript
{
  action: "aboutme",
  payload: {
    // About me data
  }
}
```

#### 6. **helpme**
Find experts.

```javascript
{
  action: "helpme",
  payload: {
    message: "...",
    geolocation: {...},
    email_id: "..."
  }
}
```

### Response Format

**Success Response:**
```javascript
{
  status: "success",
  statusCode: 200,
  action_response: {
    // Response data
  }
}
```

**Error Response:**
```javascript
{
  status: "error",
  statusCode: 400/500,
  message: "Error message"
}
```

### Backend Functions (Google Apps Script)

#### Student.js Functions

| Function | Purpose | API Action |
|----------|---------|------------|
| `getAdvice(prompt)` | Get AI advice | `advice` |
| `lockProject(projectData)` | Save/submit project | `saveproject` |
| `getStudentProjects()` | Get all student projects | `myprojects` |
| `getProjectDetails(projectId)` | Get project details | `myprojects` |
| `processDailyCheckin(userInput)` | Submit daily check-in | `morningpulse` |
| `callAIServiceInitiation(userInput)` | Start AI guidance | `guideme` |
| `callAIServiceContinue(userInput)` | Continue AI conversation | `guideme` |
| `findExperts(input)` | Find experts | `helpme` |
| `submitAboutMeInfo(input)` | Submit about me | `aboutme` |
| `callMorningPulseAPI(payload)` | Morning pulse API | `morningpulse` |

#### Teacher.js Functions

| Function | Purpose | API Action |
|----------|---------|------------|
| `getTeacherProjectsAll()` | Get all teacher projects | `myprojects` |
| `getTeacherProjectDetails(projectId, userId)` | Get project details | `myprojects` |

#### Code.js Functions

| Function | Purpose |
|----------|---------|
| `onOpen()` | Creates menu when Google Doc opens |
| `showSidebar()` | Opens sidebar |
| `currentUser()` | Gets current user email |
| `validateUser()` | Validates user and gets role |
| `openDialog(dialogType, title)` | Opens dialog with routing |
| `openPrototypeDialog(projectId)` | Opens project prototype dialog |
| `openTeacherProjectQueue()` | Opens teacher project queue |
| `openTeacherGateAssessment()` | Opens gate assessment dialog |

---

## Build & Deployment

### Build Process

1. **Build Sidebar:**
   ```bash
   npm run build:sidebar
   ```
   - Builds React app in `sidebar-client/`
   - Outputs to `sidebar-client/dist/`
   - Copies `index.html` to root as `Sidebar.html`

2. **Build Dialog:**
   ```bash
   npm run build:dialog
   ```
   - Builds React app in `dialog-client/`
   - Outputs to `dialog-client/dist/`
   - Copies `index.html` to root as `Dialog.html`

3. **Build All:**
   ```bash
   npm run build:all
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```
   - Runs `build:all` then `clasp push`
   - Pushes all files to Google Apps Script project

### Deployment Files

Files pushed to Apps Script:
- `appsscript.json` - Configuration
- `Code.js` - Main entry point
- `Student.js` - Student functions
- `Teacher.js` - Teacher functions
- `Sidebar.html` - Sidebar HTML (generated)
- `Dialog.html` - Dialog HTML (generated)

### Build Scripts (package.json)

```json
{
  "scripts": {
    "build:sidebar": "npm run build --workspace sidebar-client",
    "build:dialog": "npm run build --workspace dialog-client",
    "build:all": "npm run build:sidebar && npm run build:dialog",
    "deploy": "npm run build:all && npx clasp push"
  }
}
```

### Clasp Configuration

`.clasp.json` (not in repo, created locally):
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

---

## Development Workflow

### 1. Setup

```bash
# Clone repository
git clone https://github.com/your-username/KairosV2
cd KairosV2

# Install dependencies
npm install

# Install clasp globally
npm install -g @google/clasp

# Login to clasp
clasp login

# Create .clasp.json with your Script ID
```

### 2. Development

```bash
# Start development server for sidebar
cd sidebar-client
npm run dev

# Start development server for dialog
cd dialog-client
npm run dev
```

**Note:** Development servers run locally. To test in Google Docs:
1. Make changes
2. Build: `npm run build:all`
3. Deploy: `npx clasp push`
4. Refresh Google Doc

### 3. Making Changes

1. **Edit React Components:**
   - Make changes in `sidebar-client/src/` or `dialog-client/src/`
   - Test locally if possible
   - Build and deploy

2. **Edit Backend Functions:**
   - Edit `Code.js`, `Student.js`, or `Teacher.js`
   - Deploy with `npx clasp push`
   - Test in Google Docs

3. **Add New Features:**
   - Create new component in appropriate folder
   - Add route in `App.jsx` if needed
   - Create backend function if needed
   - Update API calls

### 4. Testing

- Test in Google Docs after deployment
- Check browser console for errors
- Check Apps Script execution logs
- Verify API responses

---

## Common Patterns

### Pattern 1: Loading Data

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  loadData();
}, []);

const loadData = () => {
  setLoading(true);
  setError(null);
  
  google.script.run
    .withSuccessHandler((response) => {
      // Parse response
      const parsed = parseResponse(response);
      setData(parsed);
      setLoading(false);
    })
    .withFailureHandler((error) => {
      setError(error.message);
      setLoading(false);
    })
    .functionName();
};
```

### Pattern 2: Flexible Response Parsing

```javascript
// Handle multiple possible response structures
let projects = [];

if (response?.body?.action_response?.projects) {
  projects = response.body.action_response.projects;
} else if (response?.body?.projects) {
  projects = response.body.projects;
} else if (Array.isArray(response)) {
  projects = response;
}
```

### Pattern 3: Editable Data with Freeze State

```javascript
const [originalData, setOriginalData] = useState(null);
const [editableData, setEditableData] = useState(null);
const [isFrozen, setIsFrozen] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Load data
const loadData = () => {
  google.script.run
    .withSuccessHandler((response) => {
      const data = response.body.project;
      setOriginalData(data);
      setEditableData(deepClone(data));
      setIsFrozen(false);
      setHasUnsavedChanges(false);
    })
    .getData();
};

// Update editable data
const updateField = (path, value) => {
  setEditableData(prev => {
    const newData = deepClone(prev);
    // Update nested path
    setNestedValue(newData, path, value);
    return newData;
  });
  setHasUnsavedChanges(true);
};

// Save changes
const saveChanges = () => {
  google.script.run
    .withSuccessHandler(() => {
      setOriginalData(editableData);
      setIsFrozen(true);
      setHasUnsavedChanges(false);
    })
    .saveData(editableData);
};
```

### Pattern 4: Error Handling

```javascript
google.script.run
  .withSuccessHandler((response) => {
    try {
      // Validate response
      if (!response || response.statusCode !== 200) {
        throw new Error('Invalid response');
      }
      // Process data
      processData(response);
    } catch (error) {
      console.error('Error processing response:', error);
      setError(error.message);
    }
  })
  .withFailureHandler((error) => {
    console.error('API call failed:', error);
    setError(error.message || 'An error occurred');
  })
  .functionName();
```

### Pattern 5: Dialog Routing

```javascript
// Backend: Set hash when opening dialog
function openDialog(dialogType, title) {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(900)
    .setHeight(700);
  
  const modifiedHtml = HtmlService.createHtmlOutput(
    html.getContent().replace(
      '<body>',
      `<body><script>window.location.hash = '${dialogType}';</script>`
    )
  );
  
  DocumentApp.getUi().showModalDialog(modifiedHtml, title);
}

// Frontend: Read hash and route
useEffect(() => {
  const hash = window.location.hash.slice(1);
  if (hash && DIALOGS[hash]) {
    setDialogType(hash);
  }
}, []);
```

---

## Important Notes

### Authentication

- Uses `Session.getActiveUser().getEmail()` to get current user
- Validates user via identity API
- Stores user_id and role in PropertiesService
- **Important:** Use one Google account per Chrome profile

### API Endpoints

- All backend functions use the same base URL
- Different actions are specified in the `action` field
- Response structure varies by action

### State Management

- Uses React hooks (useState, useEffect)
- No global state management library
- Props drilling for shared state

### Data Format

- Projects have: `project_id`, `title`, `stages[]`, `status`, etc.
- Stages have: `stage_id`, `title`, `tasks[]`, `gate{}`
- Gates have: `title`, `description`, `checklist[]`

### Current Limitations

- Some functions have hardcoded user IDs/emails
- Save functionality for project edits not fully implemented
- Some API endpoints may need additional error handling

---

## Troubleshooting

### Common Issues

1. **"vite is not recognized"**
   - Run `npm install` in both client folders

2. **Authentication errors**
   - Ensure only one Google account per Chrome profile
   - Check Script ID in .clasp.json

3. **API errors**
   - Check network tab for request/response
   - Verify API endpoint is correct
   - Check Apps Script execution logs

4. **Build errors**
   - Clear node_modules and reinstall
   - Check for syntax errors
   - Verify all dependencies installed

5. **Dialog not opening**
   - Check hash routing in App.jsx
   - Verify dialog type is registered in DIALOGS
   - Check console for errors

---

## Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Clasp Documentation](https://github.com/google/clasp)

---

**Last Updated:** 2024
**Version:** 2.0
**Maintained by:** SchoolFuel Team

