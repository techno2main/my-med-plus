import { useState, useEffect } from "react";

const LOCKOUT_DURATION_SECONDS = 30;

export function useLockoutTimer(isLockedOut: boolean, lockEndTime: number | null) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!isLockedOut || !lockEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((lockEndTime - now) / 1000);
      
      if (remaining <= 0) {
        setRemainingSeconds(0);
        clearInterval(interval);
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);

    // Initialize with current remaining time
    const now = Date.now();
    const initialRemaining = Math.ceil((lockEndTime - now) / 1000);
    setRemainingSeconds(initialRemaining > 0 ? initialRemaining : 0);

    return () => clearInterval(interval);
  }, [isLockedOut, lockEndTime]);

  return { remainingSeconds, lockoutDuration: LOCKOUT_DURATION_SECONDS };
}
