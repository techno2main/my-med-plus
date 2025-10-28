import { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function UpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  const checkForUpdates = async () => {
    console.log('🔄 Début vérification des mises à jour...');
    setIsChecking(true);
    
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      console.log('📡 Réponse fetch:', response.status);
      
      if (!response.ok) {
        console.log('❌ Erreur HTTP:', response.status);
        setIsChecking(false);
        return;
      }
      
      const serverVersion = await response.json();
      console.log('🏷️ Version serveur:', serverVersion);
      
      const currentVersion = localStorage.getItem('app_version') || '0';
      console.log('📱 Version locale:', currentVersion);
      
      if (serverVersion.timestamp.toString() !== currentVersion) {
        console.log('🆕 Nouvelle version détectée - Rechargement...');
        localStorage.setItem('app_version', serverVersion.timestamp.toString());
        toast.success('Mise à jour détectée - Rechargement...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.log('✅ Pas de mise à jour disponible');
        toast.info('Vous avez déjà la dernière version');
        setIsChecking(false);
        setJustChecked(true);
        setTimeout(() => setJustChecked(false), 2000);
      }
    } catch (error) {
      console.log('❌ Erreur lors de la vérification:', error);
      toast.error('Erreur lors de la vérification');
      setIsChecking(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={checkForUpdates}
      disabled={isChecking}
      className="p-2"
    >
      {justChecked ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <RotateCcw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
      )}
    </Button>
  );
}