import IntroductionContainer from './Shared/IntroductionContainer';
import SidebarAdvice from './Student/Advice/Advice';
import SidebarBreakTimer from './Student/Break/Break';
import AboutMe from './Student/AboutMe/AboutMe';
import GuideMe from './Student/GuideMe/GuideMe';
import StudentProjects from './Student/StudentProjects/StudentProjects';
import SidebarMorningPulse from './Student/MorningPulse/MorningPulse';
import CreateProject from './Student/CreateProject/CreateProject';
import SidebarWorkshop from './WorkshopBuilder';
import ExpertFinderComponent from './Student/FindExperts/ExpertFinderComponent';
import StandardsSelector from './Student/StandardsSelector';
import StudentPrototype from './Student/StudentPrototype/StudentPrototype';


export default function StudentDashboard({ email }) {
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
      <StandardsSelector />
    </div>
  );
}
