import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: ReactNode;
  className?: string;
}

export function OnboardingSlide({ title, description, illustration, className }: OnboardingSlideProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center px-8 py-12 text-center animate-fade-in",
      className
    )}>
      {/* Illustration */}
      <div className="mb-10">
        {illustration}
      </div>
      
      {/* Titre */}
      <h1 className="text-3xl font-bold text-foreground mb-4 animate-fade-in animation-delay-200">
        {title}
      </h1>
      
      {/* Description */}
      <p className="text-lg text-muted-foreground max-w-sm animate-fade-in animation-delay-300">
        {description}
      </p>
    </div>
  );
}
