import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseInactivityTimeoutOptions {
  timeoutMinutes: number;
  enabled: boolean;
}

export function useInactivityTimeout({ timeoutMinutes, enabled }: UseInactivityTimeoutOptions) {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    console.log('[useInactivityTimeout] Déconnexion pour inactivité');
    
    // Clear timeout first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    toast.info("Déconnexion automatique pour inactivité", {
      description: "Veuillez vous reconnecter"
    });

    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (!enabled || timeoutMinutes <= 0) return;

    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(handleLogout, timeoutMs);
  }, [enabled, timeoutMinutes, handleLogout]);

  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Activity events to listen for
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttled reset to avoid too many timer resets
    let lastReset = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 1000) { // Throttle to once per second
        lastReset = now;
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, timeoutMinutes, resetTimer]);

  return { resetTimer };
}
