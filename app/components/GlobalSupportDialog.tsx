'use client';

import { useEffect, useState } from 'react';
import SupportDialog from './SupportDialog';

export default function GlobalSupportDialog() {
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  // Show support dialog after 3 minutes globally (persistent across page changes)
  useEffect(() => {
    const hasSeenSupportDialog = localStorage.getItem('hasSeenSupportDialog');
    const lastSupportDialogDate = localStorage.getItem('lastSupportDialogDate');
    const appStartTime = localStorage.getItem('appStartTime');
    const today = new Date().toDateString();

    // Set app start time if not already set (first time visiting the app today)
    if (!appStartTime || lastSupportDialogDate !== today) {
      localStorage.setItem('appStartTime', Date.now().toString());
      localStorage.removeItem('hasSeenSupportDialog'); // Reset for new day
    }

    // Only show once per day and after user has been in the app for 3 minutes total
    if (!hasSeenSupportDialog || lastSupportDialogDate !== today) {
      const startTime = parseInt(localStorage.getItem('appStartTime') || Date.now().toString());
      const timeElapsed = Date.now() - startTime;
      const timeRemaining = Math.max(0, 3 * 60 * 1000 - timeElapsed); // 3 minutes in milliseconds

      const timer = setTimeout(() => {
        setShowSupportDialog(true);
      }, timeRemaining);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseSupportDialog = () => {
    setShowSupportDialog(false);
    // Mark that user has seen the dialog today
    localStorage.setItem('hasSeenSupportDialog', 'true');
    localStorage.setItem('lastSupportDialogDate', new Date().toDateString());
  };

  return <SupportDialog open={showSupportDialog} onClose={handleCloseSupportDialog} />;
}
