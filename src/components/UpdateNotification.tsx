import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { toast } = useToast();
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // Vérification intelligente : au démarrage, au retour focus, et toutes les 3 minutes
    const checkForUpdate = async () => {
      try {
        const response = await fetch('/version.json?' + Date.now()); // Évite le cache
        const serverVersion = await response.json();
        
        const localVersion = localStorage.getItem('app-version');
        
        if (!localVersion) {
          // Première visite : sauvegarder la version
          localStorage.setItem('app-version', serverVersion.version);
        } else if (localVersion !== serverVersion.version) {
          // Nouvelle version détectée !
          setUpdateAvailable(true);
          toast({
            title: "Mise à jour disponible",
            description: "Une nouvelle version de l'application est prête.",
            duration: 10000,
          });
        }
      } catch (error) {
        // Silencieux en cas d'erreur (pas de console.log)
      }
    };

    // 1. Vérifier immédiatement au chargement
    checkForUpdate();

    // 2. Vérifier quand l'app revient au premier plan (après minimisation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Vérifier toutes les 3 minutes en arrière-plan
    const interval = setInterval(checkForUpdate, 3 * 60 * 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [toast]);

  const handleUpdate = () => {
    // Vider tous les caches et recharger
    localStorage.removeItem('app-version');
    
    if ('caches' in globalThis) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)))
          .then(() => {
            location.reload();
          });
      });
    } else {
      location.reload();
    }
  };

  return (
    <>
      {/* Bouton de test visible UNIQUEMENT en dev */}
      {isDev && !updateAvailable && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setUpdateAvailable(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            🧪 Test badge MAJ
          </Button>
        </div>
      )}

      {/* Badge réel de mise à jour */}
      {updateAvailable && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-5">
          <Button
            onClick={handleUpdate}
            className="bg-green-600 hover:bg-green-700 text-white shadow-2xl flex items-center gap-2 ring-4 ring-green-400"
            size="lg"
          >
            <RefreshCw className="h-5 w-5 animate-spin" />
            Mettre à jour
          </Button>
        </div>
      )}
    </>
  );
};
