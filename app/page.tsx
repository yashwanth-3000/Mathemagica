import { HeroSection } from "@/components/blocks/hero-section";
import { BrainCircuit } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="relative">
        {/* Decorative elements - Adjusted colors for Mathemagica theme */}
        <div className="absolute top-10 left-[5%] w-40 h-40 bg-amber-500/5 dark:bg-amber-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-[30%] right-[5%] w-60 h-60 bg-sky-500/5 dark:bg-sky-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[60%] left-[10%] w-32 h-32 bg-rose-500/5 dark:bg-rose-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

        {/* Hero Section */}
        <div className="pt-16">
          <HeroSection
            badge={{
              text: "Learn STEM Through Comics!",
              action: {
                text: "Explore the Comics",
                href: "/book",
              },
            }}
            title="STEM Made Simple. Learning Made Fun! 🎯"
            description="Skip the confusion. Get straight to understanding. Our visual comics break down Science, Tech, Engineering & Math into bite-sized, brilliant stories."
            promptPlaceholder="e.g., 'How WiFi Works' or 'Why Bridges Don't Fall' or 'DNA Explained'"
          />
        </div>
      </main>
    </div>
  );
}
