import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { OnboardingSlide } from "./components/OnboardingSlide";
import { AnimatedIllustration } from "./components/AnimatedIllustration";
import { ProgressDots } from "./components/ProgressDots";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ChevronRight } from "lucide-react";

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

  const handleNext = useCallback(() => {
    if (currentSlide === SLIDES.length - 1) {
      completeOnboarding();
      navigate("/", { replace: true });
    } else {
      api?.scrollNext();
    }
  }, [api, currentSlide, completeOnboarding, navigate]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    navigate("/", { replace: true });
  }, [completeOnboarding, navigate]);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      {!isLastSlide && (
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
        >
          {isLastSlide ? "Commencer" : "Suivant"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
