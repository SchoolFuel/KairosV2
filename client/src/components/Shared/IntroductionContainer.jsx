import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import '../../styles/IntroductionContainer.css';
import playLessonIcon from '../../assets/play_lesson_37dp_BLACK_FILL0_wght400_GRAD0_opsz40.png';

export default function IntroductionContainer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full font-sans">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`intro-toggle-box ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="intro-toggle-content">
          <div className="intro-toggle-left">
            <img src={playLessonIcon} alt="Intro Icon" className="intro-icon" />
            <div className="intro-title">Introduction</div>
          </div>
          <ChevronDown
            className={`chevron-icon ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="intro-panel-body">
            <p>Welcome to your personalized learning experience!</p>
            <h4>
              Get started by selecting any of the options below! Need help?
              <a href="#" className="highlight"> Watch this video introduction</a>
            </h4>

            <div className="introductionVideo">
              <img src={playLessonIcon} alt="Play Lesson Icon" />
              <p>Watch video now</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
