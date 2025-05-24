"use client";

import { Book as BookComponent } from "@/components/ui/book";
import { StorySection } from "@/components/blocks/story-section";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's any legacy sessionStorage data and clean it up
    const storedData = sessionStorage.getItem('comicData');
    if (storedData) {
      // Clean up old sessionStorage data
      sessionStorage.removeItem('comicData');
      // Redirect to library where they can view their saved books
      router.push('/library');
      return;
    }
    // If no stored data, just show the original book component
  }, [router]);

  // Show the original book component
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12">
      <main className="relative">
        <div className="container mx-auto px-4 pt-12 md:pt-16">
          <BookComponent />
        </div>
        <StorySection />
      </main>
    </div>
  );
} 