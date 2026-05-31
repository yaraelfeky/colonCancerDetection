import React, { useEffect, useRef, useState } from "react";

type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  | "fade";

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number; // delay in ms
  duration?: number; // duration in ms
  threshold?: number; // visibility threshold between 0 and 1
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 800,
  threshold = 0.1,
  className = "",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before entering viewport fully
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold]);

  // Map variant to styling classes
  const getVariantStyles = (): { initial: string; revealed: string } => {
    switch (variant) {
      case "fade-up":
        return {
          initial: "opacity-0 translate-y-12 blur-[2px]",
          revealed: "opacity-100 translate-y-0 blur-0",
        };
      case "fade-down":
        return {
          initial: "opacity-0 -translate-y-12 blur-[2px]",
          revealed: "opacity-100 translate-y-0 blur-0",
        };
      case "fade-left":
        return {
          initial: "opacity-0 -translate-x-12 blur-[2px]",
          revealed: "opacity-100 translate-x-0 blur-0",
        };
      case "fade-right":
        return {
          initial: "opacity-0 translate-x-12 blur-[2px]",
          revealed: "opacity-100 translate-x-0 blur-0",
        };
      case "zoom-in":
        return {
          initial: "opacity-0 scale-90 blur-[2px]",
          revealed: "opacity-100 scale-100 blur-0",
        };
      case "zoom-out":
        return {
          initial: "opacity-0 scale-110 blur-[2px]",
          revealed: "opacity-100 scale-100 blur-0",
        };
      case "fade":
      default:
        return {
          initial: "opacity-0 blur-[2px]",
          revealed: "opacity-100 blur-0",
        };
    }
  };

  const styles = getVariantStyles();
  const transitionStyle = {
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)", // Smooth cinematic ease-out
  };

  return (
    <div
      ref={elementRef}
      className={`transition-all ${isRevealed ? styles.revealed : styles.initial} ${className}`}
      style={transitionStyle}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
