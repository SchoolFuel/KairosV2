import { useState, useEffect } from "react";
import "./App.css";
import LearningStandardsDialog from "./components/Shared/LearningStandards/LearningStandardsDialog";
import CreateProject from "./components/Student/CreateProject/CreateProject";
import TeacherProjectQueue from "./components/Teacher/TeacherProjectQueue";
import ProjectDashboard from "./components/Student/projectdashboard";

const DIALOGS = {
  "student-standards": LearningStandardsDialog,
  "create-project": CreateProject,
  "teacher-project-queue": TeacherProjectQueue,
  "add-standard": LearningStandardsDialog,
  "project-dashboard": ProjectDashboard,
};
function App() {
  const [dialogType, setDialogType] = useState("project-dashboard");

  useEffect(() => {
    // Get dialog type from URL hash
    const hash = window.location.hash.slice(1); // Remove the '#'
    if (hash && DIALOGS[hash]) {
      setDialogType(hash);
    }
  }, []);

  const DialogComponent = DIALOGS[dialogType];

  if (!DialogComponent) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error: Dialog type "{dialogType}" not found
      </div>
    );
  }
  return <DialogComponent />;
}

export default App;
