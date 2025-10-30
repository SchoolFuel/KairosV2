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
import StandardsSelector from './StandardsSelector';

export default function StudentDashboard({ email }) {
  return (
    <div>
      <IntroductionContainer />
      <SidebarMorningPulse />
      <CreateProject />
      <StudentProjects />
      <GuideMe />
      <SidebarWorkshop />
      <SidebarAdvice />
      <ExpertFinderComponent />
      <AboutMe />
      <SidebarBreakTimer />
      <StandardsSelector />
    </div>
  );
}
