import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGettingStartedCompletion } from '@/hooks/useGettingStartedCompletion';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Building2, AlertCircle, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function GettingStarted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const completion = useGettingStartedCompletion();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!user) return;

    setIsCompleting(true);

    try {
      // Marquer en localStorage
      localStorage.setItem(`gettingStartedCompleted_${user.id}`, 'true');
      
      // Marquer que le wizard a été montré (pour activer le ProfileCompletionBanner)
      localStorage.setItem(`profileWizardShownOnce_${user.id}`, 'true');

      // Mettre à jour le % de complétion en base
      await supabase
        .from('profiles')
        .update({ completion_percent: completion.overallPercent })
        .eq('id', user.id);

      toast.success('Configuration enregistrée !');
      
      // Rediriger vers l'accueil
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 300);

    } catch (error) {
      console.error('Error completing getting-started:', error);
      toast.error('Erreur lors de la sauvegarde');
      setIsCompleting(false);
    }
  };

  if (completion.isLoading) {
    return (
      <AppLayout showHeader={false} showBottomNav={false}>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false} showBottomNav={false}>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Bienvenue sur MyHealth+ !
          </h1>
          <p className="text-muted-foreground">
            Pour profiter pleinement de l'application, complétez les étapes ci-dessous.
          </p>
        </div>

        {/* Progression globale */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              {completion.overallPercent}%
            </span>
          </div>
          <Progress value={completion.overallPercent} className="h-2" />
        </Card>

        {/* Carte 1 : Mon profil */}
        <Card 
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/profile?edit=true')}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Mon profil</h3>
                {completion.profilePercent === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <span className="text-sm font-medium text-primary flex-shrink-0">
                    {completion.profilePercent}%
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {completion.profilePercent === 100 
                  ? 'Profil complet !' 
                  : `${completion.profileMissingFields} champ${completion.profileMissingFields > 1 ? 's' : ''} manquant${completion.profileMissingFields > 1 ? 's' : ''}`
                }
              </p>
              <Progress value={completion.profilePercent} className="h-1.5 mb-2" />
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-wrap gap-1">
                  {completion.profilePercent === 100 ? (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-xs">Profil complet</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded text-xs">
                      {completion.profileMissingFields} champ{completion.profileMissingFields > 1 ? 's' : ''} manquant{completion.profileMissingFields > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </Card>

        {/* Carte 2 : Mon réseau de santé */}
        <Card 
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            // Rediriger vers le bon onglet selon ce qui manque
            if (!completion.healthProfessionals.hasMedecin) {
              navigate('/referentials/health-professionals?tab=medecins');
            } else if (!completion.healthProfessionals.hasPharmacie) {
              navigate('/referentials/health-professionals?tab=pharmacies');
            } else {
              navigate('/referentials/health-professionals');
            }
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Mon réseau de santé</h3>
                {completion.healthProfessionals.percent === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <span className="text-sm font-medium text-blue-500 flex-shrink-0">
                    {completion.healthProfessionals.percent}%
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {completion.healthProfessionals.total === 0 
                  ? 'Aucun professionnel ajouté'
                  : completion.healthProfessionals.percent === 100
                  ? 'Réseau complet !'
                  : !completion.healthProfessionals.hasMedecin
                  ? 'Il manque un médecin'
                  : !completion.healthProfessionals.hasPharmacie
                  ? 'Il manque une pharmacie'
                  : `${completion.healthProfessionals.total} professionnel${completion.healthProfessionals.total > 1 ? 's' : ''} ajouté${completion.healthProfessionals.total > 1 ? 's' : ''}`
                }
              </p>
              <Progress value={completion.healthProfessionals.percent} className="h-1.5 mb-2" />
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-wrap gap-1">
                  {completion.healthProfessionals.hasMedecin ? (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded">Médecin</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded">Médecin manquant</span>
                  )}
                  {completion.healthProfessionals.hasPharmacie ? (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded">Pharmacie</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded">Pharmacie manquante</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </Card>

        {/* Carte 3 : Mes allergies (optionnel) */}
        <Card 
          className="p-4 hover:shadow-md transition-shadow cursor-pointer border-dashed"
          onClick={() => navigate('/referentials/allergies')}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Mes allergies</h3>
                <span className="text-xs text-muted-foreground flex-shrink-0">Optionnel</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {completion.allergiesCount === 0 
                  ? 'Aucune allergie déclarée' 
                  : `${completion.allergiesCount} allergie${completion.allergiesCount > 1 ? 's' : ''} déclarée${completion.allergiesCount > 1 ? 's' : ''}`
                }
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Médicaments, aliments...</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Card>

        {/* Bouton "Plus tard" ou "Commencer" */}
        <div className="pt-4">
          <Button 
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full h-12"
            variant={completion.overallPercent === 100 ? "default" : "outline"}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              completion.overallPercent === 100 ? 'Commencer' : 'Je complèterai plus tard'
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {completion.overallPercent === 100 
              ? 'Votre configuration est complète !'
              : 'Vous pourrez compléter ces informations depuis votre profil'
            }
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
