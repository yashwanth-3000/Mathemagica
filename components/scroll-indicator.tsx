"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollIndicatorProps {
  targetId?: string;
  className?: string;
}

export function ScrollIndicator({ targetId = "content", className }: ScrollIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTarget = () => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // If no target id is found, just scroll down a bit
      window.scrollTo({
        top: window.innerHeight - 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none",
        className
      )}
    >
      <button
        onClick={scrollToTarget}
        className="flex flex-col items-center justify-center group"
        aria-label="Scroll down"
      >
        <div className="text-xs font-medium text-muted-foreground mb-2 opacity-80 transition-colors group-hover:text-foreground">
          Scroll
        </div>
        <div className="w-8 h-14 border border-border/40 rounded-full flex items-center justify-center relative p-1">
          <div className="w-1.5 h-3 bg-[hsl(var(--brand))] rounded-full animate-bounce-subtle"></div>
          <div className="absolute -bottom-4">
            <ChevronDown className="h-4 w-4 text-muted-foreground animate-bounce-subtle" />
          </div>
        </div>
      </button>
    </div>
  );
} 