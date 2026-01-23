import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { OnboardingSlide } from "./components/OnboardingSlide";
import { AnimatedIllustration } from "./components/AnimatedIllustration";
import { ProgressDots } from "./components/ProgressDots";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SLIDES = [
  {
    id: "welcome",
    title: "Bienvenue sur MyHealth+",
    description: "Votre assistant santé personnel pour ne plus jamais oublier vos médicaments",
    illustrationType: "welcome" as const,
  },
  {
    id: "treatments",
    title: "Gérez vos traitements",
    description: "Créez et suivez tous vos traitements médicaux en un seul endroit, simplement",
    illustrationType: "treatments" as const,
  },
  {
    id: "reminders",
    title: "Ne ratez plus aucune prise",
    description: "Recevez des notifications intelligentes pour chaque prise de médicament",
    illustrationType: "reminders" as const,
  },
  {
    id: "stocks",
    title: "Suivez vos stocks",
    description: "Soyez alerté avant de manquer de médicaments avec le suivi automatique",
    illustrationType: "stocks" as const,
  },
  {
    id: "start",
    title: "Prêt à commencer ?",
    description: "Créez votre premier traitement en quelques clics et prenez le contrôle de votre santé",
    illustrationType: "start" as const,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasAlreadySeenOnboarding, setHasAlreadySeenOnboarding] = useState(false);

  // Vérifier si l'onboarding a déjà été vu au chargement
  useEffect(() => {
    const checkOnboardingSeen = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        const hasSeenKey = `hasSeenOnboarding_${userId}`;
        const hasAlreadySeen = localStorage.getItem(hasSeenKey) === 'true';
        setHasAlreadySeenOnboarding(hasAlreadySeen);
      }
    };
    
    checkOnboardingSeen();
  }, []);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleComplete = useCallback(async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    // Attendre que l'onboarding soit complété
    const success = await completeOnboarding();
    
    if (success) {
      // Vérifier si getting-started a déjà été complété
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        // Vérifier dans localStorage
        const gettingStartedCompleted = localStorage.getItem(`gettingStartedCompleted_${userId}`) === 'true';
        
        // Si déjà complété, aller directement à l'accueil
        if (gettingStartedCompleted) {
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 100);
          return;
        }
        
        // Sinon, vérifier en base de données
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('getting_started_completed')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (prefs?.getting_started_completed) {
          // Synchroniser localStorage avec la base
          localStorage.setItem(`gettingStartedCompleted_${userId}`, 'true');
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 100);
          return;
        }
      }
      
      // Première fois : aller à getting-started
      setTimeout(() => {
        navigate("/getting-started", { replace: true });
      }, 100);
    } else {
      console.error('Échec de la complétion de l\'onboarding');
      setIsCompleting(false);
    }
  }, [completeOnboarding, navigate, isCompleting]);

  const handleNext = useCallback(() => {
    if (currentSlide === SLIDES.length - 1) {
      handleComplete();
    } else {
      api?.scrollNext();
    }
  }, [api, currentSlide, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button - Affiché uniquement si l'onboarding a déjà été vu */}
      {!isLastSlide && !isCompleting && hasAlreadySeenOnboarding && (
        <div className="absolute top-6 right-6 z-10">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Passer
          </Button>
        </div>
      )}

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center">
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: false,
          }}
          className="w-full max-w-lg"
        >
          <CarouselContent>
            {SLIDES.map((slide) => (
              <CarouselItem key={slide.id}>
                <OnboardingSlide
                  title={slide.title}
                  description={slide.description}
                  illustration={<AnimatedIllustration type={slide.illustrationType} />}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 space-y-8">
        {/* Progress dots */}
        <ProgressDots total={SLIDES.length} current={currentSlide} />

        {/* Action button */}
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full h-14 text-lg font-semibold shadow-glow"
          disabled={isCompleting}
        >
          {isCompleting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              {isLastSlide ? "Commencer" : "Suivant"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
