import { useEffect } from 'react';
import { BUILD_VERSION } from '@/lib/version';

export function usePullToRefresh() {
  useEffect(() => {
    // Initialiser la version actuelle au premier chargement
    const initVersion = async () => {
      try {
        const response = await fetch('/version.json');
        const currentVersion = await response.json();
        localStorage.setItem('app_version', currentVersion.timestamp.toString());
      } catch (error) {
        console.log('Erreur initialisation version:', error);
      }
    };
    
    if (!localStorage.getItem('app_version')) {
      initVersion();
    }

    let startY = 0;
    let isAtTop = false;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      // Check if we're at the top of any scrollable element
      isAtTop = window.scrollY <= 10; // More tolerant threshold
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || window.scrollY > 10) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      // Trigger refresh at 80px pull distance
      if (pullDistance > 80 && !isPulling) {
        isPulling = true;
        // Force reload immediately on pull
        window.location.reload();
      }
    };

    const handleTouchEnd = () => {
      isPulling = false;
    };

    const checkForUpdates = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now());
        const serverVersion = await response.json();
        
        // Comparer avec la version locale
        const currentVersion = localStorage.getItem('app_version') || '0';
        
        if (serverVersion.timestamp.toString() !== currentVersion) {
          // Sauvegarder la nouvelle version
          localStorage.setItem('app_version', serverVersion.timestamp.toString());
          // Nouvelle version détectée - recharger l'app
          window.location.reload();
        }
      } catch (error) {
        console.log('Erreur lors de la vérification de version:', error);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
}