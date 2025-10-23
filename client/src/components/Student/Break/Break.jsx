import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, ChevronDown } from 'lucide-react';

export default function SidebarBreakTimer() {
  const [duration, setDuration] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(5 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break time is over!', {
          body: 'Time to get back to work.',
          icon: '☕'
        });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const handleStart = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };
  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
    setIsRunning(false);
    setIsConfiguring(false);
  };

  const handleCustomTimerSet = () => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes > 0) {
      setDuration(totalMinutes);
      setTimeLeft(totalMinutes * 60);
      setIsRunning(false);
      setIsConfiguring(false);
      setCustomHours('');
      setCustomMinutes('');
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) setIsConfiguring(false);
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  const getStatusColor = () => timeLeft === 0 ? 'text-green-600' : isRunning ? 'text-blue-600' : 'text-gray-600';
  const getStatusDot = () => timeLeft === 0 ? 'bg-green-500' : isRunning ? 'bg-blue-500' : 'bg-gray-400';

  return (
    <div className="w-full font-sans">
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200">
        {/* Header Area */}
        <div
          onClick={toggleExpanded}
          className="p-3 cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Coffee className={`w-5 h-5 ${getStatusColor()}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDot()}`}></div>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-base">Break Timer</div>
                <div className="text-sm text-gray-500">
                  {isRunning ? 
                    `${formatTime(timeLeft)} left` : 
                    duration >= 60 ? 
                      `${Math.floor(duration / 60)}h ${duration % 60}m ready` : 
                      `${duration}m ready`
                  }
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-100">
            {/* Configuration */}
            {isConfiguring && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Set Duration</h4>
                
                {/* Quick Presets */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Quick Presets</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 5, 10, 15, 20, 25, 30].map((min) => (
                      <button
                        key={min}
                        onClick={() => handleDurationChange(min)}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition ${
                          duration === min
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-300'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time Input */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Custom Duration</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="0"
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <label className="text-xs text-gray-500 mt-1 block">Hours</label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <label className="text-xs text-gray-500 mt-1 block">Minutes</label>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCustomTimerSet}
                  disabled={!customHours && !customMinutes}
                  className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Set Timer
                </button>
              </div>
            )}

            {/* Timer UI */}
            <div className="text-center mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`} break
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-3 mb-4">
              <button
                onClick={handleStart}
                className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md ${
                  isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                } text-white transition`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-md transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsConfiguring(!isConfiguring)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Status Label */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                timeLeft === 0
                  ? 'bg-green-100 text-green-800'
                  : isRunning
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {timeLeft === 0 ? '✨ Break Complete!' : isRunning ? '⏰ Timer Active' : '⏸️ Timer Paused'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}