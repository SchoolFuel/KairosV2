import { useState, useEffect } from "react";
import "./App.css";
import LearningStandardsDialog from "./components/Shared/LearningStandards/LearningStandardsDialog";
import CreateProject from "./components/Student/CreateProject/CreateProject";
import TeacherProjectQueue from "./components/Teacher/TeacherProjectQueue";
<<<<<<< HEAD
import ProjectDashboard from "./components/Student/projectdashboard";
=======
import ProjectDashboard from './components/Student/MyProjects/projectdashboard';
>>>>>>> e6237fa7d6cb2d38e27fbe8097414514a25b519c

const DIALOGS = {
  "student-standards": LearningStandardsDialog,
  "create-project": CreateProject,
  "project-dashboard": ProjectDashboard,
  "teacher-project-queue": TeacherProjectQueue,
  //"teacher-gate-assessment": GateStandards,
  "add-standard": LearningStandardsDialog,
  "project-dashboard": ProjectDashboard,
};
function App() {
  const [dialogType, setDialogType] = useState("project-dashboard");

  useEffect(() => {
    // Get dialog type from URL hash
    const hash = window.location.hash.slice(1); // Remove the '#'
    const hash = window.location.hash.slice(1); // Remove the '#'
    if (hash && DIALOGS[hash]) {
      setDialogType(hash);
      setDialogType(hash);
    }
  }, []);
  }, []);

  const DialogComponent = DIALOGS[dialogType];
  const DialogComponent = DIALOGS[dialogType];

  if (!DialogComponent) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error: Dialog type "{dialogType}" not found
      </div>
    );
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error: Dialog type "{dialogType}" not found
      </div>
    );
  }
  return <DialogComponent />;
  return <DialogComponent />;
}

export default App;
export default App;
