"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  image?: {
    light: string;
    dark: string;
    alt: string;
  };
  promptPlaceholder?: string;
  onPromptSubmit?: (prompt: string) => void;
}

export function HeroSection({
  badge,
  title,
  description,
  image,
  promptPlaceholder = "Tell us what you want to explore...",
  onPromptSubmit
}: HeroProps) {
  const { resolvedTheme } = useTheme();
  const imageSrc = image && (resolvedTheme === "light" ? image.light : image.dark);
  const [promptValue, setPromptValue] = useState("");
  const router = useRouter();

  const handlePromptSubmit = () => {
    if (promptValue.trim()) {
      router.push(`/book-progress?prompt=${encodeURIComponent(promptValue.trim())}`);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handlePromptSubmit();
    }
  };

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-12 sm:py-24 md:py-32 px-4",
        "overflow-hidden pb-0 min-h-screen"
      )}
      style={{
        backgroundImage: "url('/comic_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {badge && (
            <Badge 
              variant="outline" 
              className="animate-appear gap-2 hover-scale bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm border-neutral-400/80 dark:border-neutral-600/80 shadow-md"
            >
              <span className="text-neutral-700 dark:text-neutral-200 font-medium">{badge.text}</span>
              <a href={badge.action.href} className="flex items-center gap-1 group text-amber-700 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            </Badge>
          )}

          <div className="relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-300 ease-in-out my-4 md:my-6">
            <h1 
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-sans text-center text-black bg-yellow-100 dark:bg-orange-100 p-3 sm:p-4 md:p-6 border-4 border-black rounded-lg shadow-2xl shadow-black/60 dark:shadow-black/80 inline-block"
            >
              {title}
            </h1>
          </div>

          <div className="relative z-10 max-w-xl md:max-w-2xl mx-auto mt-4 md:mt-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300 ease-in-out">
            <p 
              className="font-sans font-bold text-base sm:text-lg md:text-xl text-black dark:text-yellow-50 bg-yellow-50 dark:bg-neutral-800 p-4 sm:p-5 border-[3px] border-black dark:border-yellow-300 rounded-lg shadow-xl shadow-neutral-700/50 dark:shadow-black/60 backdrop-blur-sm animate-appear opacity-0 delay-100"
              style={{ animationDelay: '600ms' }}
            >
              {description}
            </p>
          </div>

          <div 
            className="relative z-10 mt-8 md:mt-10 flex w-full max-w-xl animate-appear items-center space-x-2 rounded-full bg-stone-50 dark:bg-neutral-700 backdrop-blur-sm p-2 shadow-2xl border border-stone-300 dark:border-neutral-500 opacity-0 delay-300"
            style={{ animationDelay: '800ms' }}
          >
            <SparklesIcon className="h-5 w-5 text-amber-500 dark:text-amber-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={promptPlaceholder}
              className="flex-grow bg-transparent p-2 text-foreground placeholder-muted-foreground focus:outline-none text-sm sm:text-base"
            />
            <Button 
              variant="glow" 
              size="sm" 
              onClick={handlePromptSubmit}
              className="rounded-full px-5 py-2.5 text-sm hover-lift"
            >
              <SearchIcon className="h-4 w-4 sm:mr-1.5" /> 
              <span className="hidden sm:inline">Create</span>
            </Button>
          </div>

          {image && (
            <div className="relative pt-12 w-full max-w-[1000px] mx-auto">
              <MockupFrame
                className="animate-appear opacity-0 delay-700 hover-rotate hover:shadow-xl hover:shadow-[hsla(var(--brand)/0.1)] transition-all duration-500"
                size="small"
                style={{ animationDelay: '1000ms' }}
              >
                <Mockup type="responsive">
                  <div className="relative overflow-hidden">
                    <Image
                      src={imageSrc!}
                      alt={image.alt}
                      width={1248}
                      height={765}
                      priority
                      className="transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </Mockup>
              </MockupFrame>
              <Glow
                variant="top"
                className="animate-appear-zoom opacity-0 delay-1000"
                style={{ animationDelay: '1200ms' }}
              />
              
              <div className="absolute top-[30%] left-[10%] w-12 h-12 rounded-full bg-[hsla(var(--brand)/0.2)] blur-xl animate-float opacity-40"
                   style={{ animationDelay: '0s' }} />
              <div className="absolute top-[60%] right-[15%] w-10 h-10 rounded-full bg-[hsla(var(--brand-foreground)/0.3)] blur-xl animate-float opacity-30"
                   style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-[20%] left-[20%] w-8 h-8 rounded-full bg-[hsla(var(--brand)/0.3)] blur-lg animate-float opacity-25"
                   style={{ animationDelay: '4s' }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
