import { useEffect, useState } from 'react';

/**
 * Custom hook to handle My Spark gate logic (hide check and stats fetching)
 * @param {Function} setPhase - Function to set the dashboard phase
 * @returns {Object} - { mySparkStats }
 */
export function useMySparkGate(setPhase) {
  const [mySparkStats, setMySparkStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    // TESTING: Set an older date to allow testing even after setting the flag
    // This sets yesterday's date so the page will always show (since it's not today)
    // const yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);
    // localStorage.setItem('mySparkHideDate', yesterday.toISOString().split('T')[0]);
    
    // Check if My Spark should be hidden today (frontend localStorage)
    const checkHideToday = () => {
      try {
        const hideDate = localStorage.getItem('mySparkHideDate');
        if (!hideDate || hideDate === null || hideDate === undefined) {
          return false; // Not hidden - show My Spark
        }
        const trimmedDate = String(hideDate).trim();
        if (trimmedDate === '') {
          localStorage.removeItem('mySparkHideDate');
          return false; // Not hidden - show My Spark
        }
        const today = new Date().toISOString().split('T')[0];
        if (trimmedDate === today) {
          return true; // Hidden for today
        } else {
          localStorage.removeItem('mySparkHideDate');
          return false; // Not hidden - show My Spark
        }
      } catch (e) {
        try {
          localStorage.removeItem('mySparkHideDate');
        } catch (clearError) {
          // Ignore clear errors
        }
        return false; // On error, show My Spark
      }
    };
    
    // Check if hidden today first
    const isHiddenToday = checkHideToday();
    if (isHiddenToday) {
      if (mounted) {
        setPhase?.('home');
      }
      return;
    }
    
    // Fetch My Spark stats from backend
    try {
      if (window.google && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((result) => {
            if (mounted && result && result.success) {
              // Set stats and show My Spark
              if (mounted && result.stats) {
                setMySparkStats(result.stats);
              }
              if (mounted) {
                setPhase?.('myspark');
              }
            } else {
              if (mounted) {
                setMySparkStats(null);
                setPhase?.('myspark');
              }
            }
          })
          .withFailureHandler(() => {
            if (mounted) {
              setMySparkStats(null); // Use defaults if fetch fails
              setPhase?.('myspark');
            }
          })
          .getMySparkStats();
      } else {
        // Not in Apps Script, use defaults
        if (mounted) {
          setPhase?.('myspark');
        }
      }
    } catch (e) {
      // Fallback on error
      if (mounted) {
        setPhase?.('myspark');
      }
    }
    
    return () => { mounted = false; };
  }, [setPhase]);

  return { mySparkStats };
}
