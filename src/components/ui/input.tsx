import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, ...props }, ref) => {
    const hasAutoSelectedRef = React.useRef(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Sélectionner automatiquement seulement sur desktop (pas tactile)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (!isTouchDevice && !hasAutoSelectedRef.current && e.target.value) {
        e.target.select();
        hasAutoSelectedRef.current = true;
      }
      
      if (onFocus) onFocus(e);
    };

    const handleBlur = () => {
      hasAutoSelectedRef.current = false;
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3.5 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [color-scheme:dark]",
          className,
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
