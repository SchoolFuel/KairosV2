import { useState,useEffect } from 'react'
import './App.css'
import DialogDashboard from './components/Student/Dashboard'
import LearningStandardsDialog from './components/Shared/LearningStandards/LearningStandardsDialog'
import CreateProject from './components/Student/CreateProject/CreateProject'
import ProjectDashboard from './components/Student/MyProjects/projectdashboard';

const DIALOGS = {
    "dashboard":DialogDashboard,
    "student-standards":LearningStandardsDialog,
    "create-project":CreateProject,
    "project-dashboard": ProjectDashboard
  }
function App() {
  
  const [dialogType, setDialogType] = useState('dashboard')

  useEffect(() => {
    // Get dialog type from URL hash
    const hash = window.location.hash.slice(1) // Remove the '#'
    if (hash && DIALOGS[hash]) {
      setDialogType(hash)
    }
  }, [])

  const DialogComponent = DIALOGS[dialogType]

  if (!DialogComponent) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: Dialog type "{dialogType}" not found</div>
  }
  return <DialogComponent />
}

export default App
