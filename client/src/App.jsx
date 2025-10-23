import { useEffect, useState } from 'react';
import Credentials from './components/Shared/Credentials';
import LogoContainer from './components/Shared/LogoContainer';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import UnauthorizedUser from './components/Shared/UnauthorizedUser';
import 'bootstrap/dist/css/bootstrap.min.css';
import Loader from './components/Shared/Loader';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    google.script.run
      .withSuccessHandler((response) => {
        if (response.statusCode === 200) {
          setIsAuthorized(true);
          setUserEmail(response.email);
          setUserRole(response.role);
        } else {
          setIsAuthorized(false);
        }
      })
      .validateUser();
  }, []);

  if (isAuthorized === null) return <Loader />;

  if (!isAuthorized) return <UnauthorizedUser />;

  return (
    <div className="App-container">
      <Credentials email={userEmail} />
      <LogoContainer />
      {userRole === 'Teacher' ? (
        <TeacherDashboard email={userEmail} />
      ) : (
        <StudentDashboard email={userEmail} />
      )}
    </div>
  );
}