import React, { useState } from 'react';
import igniteIcon from '../../assets/Ignite Help Icon.png';

export default function MySpark({ onContinue, userName = 'User', stats = null, onHideToday = null }) {
  const [hideToday, setHideToday] = useState(false);
  // Use real stats if provided, otherwise use defaults
  const projectsCompleted = stats?.projectsCompleted ?? 0;
  const totalProjects = stats?.totalProjects ?? 0;
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const totalTasks = stats?.totalTasks ?? 0;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <img src={igniteIcon} alt="Ignite Help" className="w-10 h-10 flex-shrink-0 object-contain" />
        <h2 className="text-2xl font-semibold">Here's how you've been crushing it</h2>
      </div>

      <p className="text-gray-600 mt-2">
        Welcome back, <span className="font-semibold">{userName}</span>! Based on recent activity, here are a few highlights to kickstart your day.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">Projects Completed</div>
          <div className="text-2xl font-bold mt-1">{projectsCompleted}/{totalProjects}</div>
          <div className="text-xs text-gray-500 mt-1">Total projects</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">Tasks Completed</div>
          <div className="text-2xl font-bold mt-1">{tasksCompleted}/{totalTasks}</div>
          <div className="text-xs text-gray-500 mt-1">Total tasks</div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideToday}
            onChange={(e) => setHideToday(e.target.checked)}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-600">Don't show again today</span>
        </label>
        <button
          onClick={() => {
            if (hideToday && onHideToday) {
              onHideToday();
            }
            onContinue();
          }}
          className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

