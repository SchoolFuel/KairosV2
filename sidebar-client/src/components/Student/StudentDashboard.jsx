import React, { useState } from 'react';
import MySpark from '../Shared/MySpark';
import { useMySparkGate } from '../Shared/MySparkGate';
import IntroductionContainer from '../Shared/IntroductionContainer';
import SidebarAdvice from './Advice/Advice';
import SidebarBreakTimer from './Break/Break';
import AboutMe from './AboutMe/AboutMe';
import GuideMe from './GuideMe/GuideMe';
import StudentProjects from './StudentProjects/StudentProjects';
import SidebarMorningPulse from './MorningPulse/MorningPulse';
import CreateProject from './CreateProject/CreateProject';
import SidebarWorkshop from './Workshopbuilder/Workshopbuilder';
import ExpertFinderComponent from './FindExperts/ExpertFinderComponent';
import StudentPrototype from './MyProjectsPrototype/StudentProjectsProt';

export default function StudentDashboard({ email }) {
  const [phase, setPhase] = useState('verifying'); // 'verifying' | 'myspark' | 'home'
  const { mySparkStats } = useMySparkGate(setPhase);

  const openIgniteHelp = () => {
    try {
      google.script.run.openIgniteHelp();
    } catch (e) {
      // no-op if not in Apps Script container
    }
  };

  if (phase === 'verifying') {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
          <span>Verifying your credentials…</span>
        </div>
      </div>
    );
  }

  const handleHideMySpark = () => {
    try {
      // Store today's date in localStorage to hide My Spark for today
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('mySparkHideDate', today);
    } catch (e) {
      // Ignore errors
    }
  };

  if (phase === 'myspark') {
    return <MySpark userName={email || 'Student'} stats={mySparkStats} onContinue={() => setPhase('home')} onHideToday={handleHideMySpark} />;
  }

  return (
    <div>
      <IntroductionContainer />
      <SidebarMorningPulse />
      <CreateProject />
      <StudentProjects />
      <StudentPrototype />
      <GuideMe />
      <SidebarWorkshop />
      <SidebarAdvice />
      <ExpertFinderComponent />
      <AboutMe />
      <SidebarBreakTimer />

      {/* IgniteHelp Button */}
      <div className="w-full max-w-[300px] font-sans mt-4">
        <button
          onClick={openIgniteHelp}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-xl">⚡</span>
          IgniteHelp
        </button>
      </div>
    </div>
  );
}
