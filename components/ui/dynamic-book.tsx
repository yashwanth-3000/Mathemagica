"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  Book as BookIcon, 
  Bookmark, 
  ArrowLeftCircle,
  ArrowRightCircle,
  BookOpen,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

// Define the types for our dynamic content
interface BookPageImage {
  id: string | number;
  title: string;
  src: string;
  base64?: string;
  prompt?: string;
}

interface StoryPart {
  part_number: number;
  chapter_title: string;
  story_content: string;
}

interface BookPageContent {
  id: string;
  type: 'story' | 'image' | 'mixed';
  title: string;
  content?: string; // For story content
  image?: BookPageImage; // For image
  pageNumber: number;
  chapterName?: string; // Add chapter name for display at top
}

interface DynamicBookProps {
  title: string;
  story: string;
  images: BookPageImage[];
  className?: string;
  storyParts?: StoryPart[]; // Add optional story parts
  chapterName?: string; // Add overall chapter name
}

// Component to display individual page content
const PageDisplay = ({ page, pageNumber }: { page: BookPageContent | null, pageNumber: number }) => {
  if (!page) {
    return (
      <div className="flex items-center justify-center h-full text-amber-700/70 dark:text-amber-300/70">
        <div className="text-center">
          <BookIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm font-serif italic">End of Book</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chapter Name at Top - Prominent Display */}
      {page.chapterName && (
        <div className="mb-4 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400 leading-tight">
            📖 {page.chapterName}
          </h1>
        </div>
      )}

      <div className="mb-2 pb-2 border-b-4 border-black">
        <div className="flex items-center text-xs font-mono text-red-600 dark:text-red-500 mb-0.5 tracking-wider font-bold">
          {page.type === 'story' ? (
            <BookOpen className="inline-block h-3.5 w-3.5 mr-1.5 opacity-80 flex-shrink-0" />
          ) : page.type === 'mixed' ? (
            <div className="flex items-center mr-1.5">
              <ImageIcon className="inline-block h-2.5 w-2.5 opacity-80 flex-shrink-0" />
              <BookOpen className="inline-block h-2.5 w-2.5 ml-0.5 opacity-80 flex-shrink-0" />
            </div>
          ) : (
            <ImageIcon className="inline-block h-3.5 w-3.5 mr-1.5 opacity-80 flex-shrink-0" />
          )}
          <span className="truncate bg-yellow-300 px-2 py-1 rounded border-2 border-black shadow-sm">
            {page.type === 'story' ? 'STORY' : page.type === 'image' ? 'COMIC ART' : 'COMIC PANEL'}
          </span>
        </div>
        <h2 className="text-md md:text-lg font-bold text-black leading-tight truncate comic-title" title={page.title} style={{ textShadow: "2px 2px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff" }}>
          {page.title}
        </h2>
      </div>
      
      <div className="relative w-full flex-1 bg-white rounded-md overflow-hidden shadow-inner border-4 border-black">
        {page.type === 'story' && page.content ? (
          <div className="h-full p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-yellow-200">
            <div className="prose prose-base prose-stone max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ ...props}) => <p className="mb-4 text-black leading-relaxed text-base font-medium bg-yellow-100 p-3 rounded border-2 border-black shadow-sm" {...props} />,
                  h1: ({ ...props}) => <h1 className="text-xl font-bold my-4 text-red-600 bg-yellow-300 p-2 rounded border-2 border-black" {...props} />,
                  h2: ({ ...props}) => <h2 className="text-lg font-semibold my-3 text-blue-600 bg-cyan-200 p-2 rounded border-2 border-black" {...props} />,
                  h3: ({ ...props}) => <h3 className="text-md font-semibold my-2 text-purple-600 bg-pink-200 p-1 rounded border-2 border-black" {...props} />,
                  strong: ({ ...props}) => <strong className="font-bold text-red-700 bg-yellow-200 px-1 rounded" {...props} />,
                  em: ({ ...props}) => <em className="italic text-blue-700 bg-cyan-100 px-1 rounded" {...props} />,
                }}
              >
                {page.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (page.type === 'image' || page.type === 'mixed') && page.image ? (
          <div className="h-full flex flex-col p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-yellow-200">
            {/* Image Section */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-3/4 aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-lg border-4 border-black">
                <Image 
                  src={page.image.src}
                  alt={page.image.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="w-full h-full"
                />
                {/* Comic book style corner decoration */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-400 border-2 border-black rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Story Section at Bottom */}
            {page.content && (
              <div className="flex-1 bg-white rounded-md p-4 shadow-inner border-4 border-black">
                <div className="prose prose-sm prose-stone max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ ...props}) => <p className="mb-3 text-black leading-relaxed text-sm font-medium bg-yellow-100 p-2 rounded border-2 border-black shadow-sm" {...props} />,
                      h1: ({ ...props}) => <h1 className="text-lg font-bold my-3 text-red-600 bg-yellow-300 p-2 rounded border-2 border-black" {...props} />,
                      h2: ({ ...props}) => <h2 className="text-md font-semibold my-2 text-blue-600 bg-cyan-200 p-1 rounded border-2 border-black" {...props} />,
                      h3: ({ ...props}) => <h3 className="text-sm font-semibold my-2 text-purple-600 bg-pink-200 p-1 rounded border-2 border-black" {...props} />,
                      strong: ({ ...props}) => <strong className="font-bold text-red-700 bg-yellow-200 px-1 rounded" {...props} />,
                      em: ({ ...props}) => <em className="italic text-blue-700 bg-cyan-100 px-1 rounded" {...props} />,
                    }}
                  >
                    {page.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-red-600 bg-yellow-100 border-4 border-black rounded">
            <p className="text-sm font-bold">No content available</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end mt-2 pt-2 border-t-4 border-black text-xs">
        <div className="text-black font-mono tracking-wider font-bold bg-red-400 px-2 py-1 rounded border-2 border-black">COMIC BOOK</div>
        <div className="font-serif text-black font-bold bg-yellow-400 px-2 py-1 rounded border-2 border-black">{pageNumber.toString().padStart(2, '0')}</div>
      </div>
    </>
  );
};

export function DynamicBook({ title, story, images, className, storyParts, chapterName }: DynamicBookProps) {
  const bookRef = useRef<HTMLDivElement>(null);
  const pageTurnSoundRef = useRef<HTMLAudioElement>(null);

  const [isFlipping, setIsFlipping] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const flipperControls = useAnimation();
  const animationDuration = 1.2; // seconds

  // Convert story and images into book pages
  const createBookPages = (): BookPageContent[] => {
    const pages: BookPageContent[] = [];
    let pageNumber = 1;

    // If we have story parts, create pages with each image paired with its corresponding story part
    if (storyParts && storyParts.length > 0) {
      storyParts.forEach((part, index) => {
        const correspondingImage = images[index]; // Match story part with image by index
        
        if (correspondingImage) {
          pages.push({
            id: `mixed-${correspondingImage.id}-part-${part.part_number}`,
            type: 'mixed',
            title: correspondingImage.title,
            image: correspondingImage,
            content: part.story_content, // Show only this part's content
            pageNumber: pageNumber++,
            chapterName: part.chapter_title // Use individual part chapter title
          });
        } else {
          // If no corresponding image, create a story-only page
          pages.push({
            id: `story-part-${part.part_number}`,
            type: 'story',
            title: part.chapter_title,
            content: part.story_content,
            pageNumber: pageNumber++,
            chapterName: part.chapter_title
          });
        }
      });
    } else {
      // Fallback to original behavior: Create pages with each image showing the full story
      images.forEach((image) => {
        pages.push({
          id: `mixed-${image.id}`,
          type: 'mixed',
          title: image.title,
          image: image,
          content: story, // Show the full story with each image
          pageNumber: pageNumber++,
          chapterName: chapterName // Use overall chapter name
        });
      });
    }

    // If there are no images, create story pages from parts or single story page
    if (images.length === 0) {
      if (storyParts && storyParts.length > 0) {
        storyParts.forEach((part) => {
          pages.push({
            id: `story-part-${part.part_number}`,
            type: 'story',
            title: part.chapter_title,
            content: part.story_content,
            pageNumber: pageNumber++,
            chapterName: part.chapter_title
          });
        });
      } else {
        pages.push({
          id: 'story-only',
          type: 'story',
          title: title,
          content: story,
          pageNumber: 1,
          chapterName: chapterName
        });
      }
    }

    return pages;
  };

  const bookPages = createBookPages();
  const totalPages = bookPages.length;

  const flippingPageTransition = {
    duration: animationDuration,
    ease: [0.33, 1, 0.68, 1], 
  };

  const playPageTurnSound = () => {
    if (pageTurnSoundRef.current) {
      const currentSrc = pageTurnSoundRef.current.src;
      if (currentSrc && pageTurnSoundRef.current.readyState >= 2) {
        pageTurnSoundRef.current.currentTime = 0;
        pageTurnSoundRef.current.play().catch(error => console.warn("Audio play error:", error));
      }
    }
  };

  const handleNextPage = useCallback(async () => {
    // Ensure we don't navigate beyond available page spreads
    // For a spread layout, we need at least 2 pages or we're at the last spread
    if (currentPageIndex + 2 < totalPages && !isFlipping) {
      playPageTurnSound();
      setFlipDirection('forward');
      setIsFlipping(true);
      await flipperControls.start({
        rotateY: -180,
        translateZ: [0, 30, 10, 0],
        rotateX: [0, 5, 0],
        zIndex: 20,
        transition: flippingPageTransition,
      });
      setCurrentPageIndex(prev => prev + 2);
      setIsFlipping(false);
    }
  }, [currentPageIndex, totalPages, isFlipping, flipperControls, flippingPageTransition]);

  const handlePrevPage = useCallback(async () => {
    if (currentPageIndex > 0 && !isFlipping) {
      playPageTurnSound();
      setFlipDirection('backward');
      setIsFlipping(true);
      requestAnimationFrame(async () => {
        flipperControls.set({ rotateY: -180, rotateX: 0, translateZ: 0, zIndex: 20 }); 
        await flipperControls.start({
          rotateY: 0,
          translateZ: [0, 30, 10, 0],
          rotateX: [0, 5, 0],
          zIndex: 20,
          transition: flippingPageTransition,
        });
        setCurrentPageIndex(prev => prev - 2);
        setIsFlipping(false);
      });
    }
  }, [currentPageIndex, isFlipping, flipperControls, flippingPageTransition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        handleNextPage();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, isFlipping, handleNextPage, handlePrevPage]);

  // Determine which pages to show
  let displayLeftPageData: BookPageContent | null = null;
  let displayLeftPageNumber: number = 0;
  let flipperFrontData: BookPageContent | null = null;
  let flipperFrontPageNumber: number = 0;
  let flipperBackData: BookPageContent | null = null;
  let flipperBackPageNumber: number = 0;
  let baseRightData: BookPageContent | null = null;
  let baseRightPageNumber: number = 0;

  if (flipDirection === 'forward') {
    // Current spread: left is currentPageIndex, right is currentPageIndex + 1
    displayLeftPageData = bookPages[currentPageIndex] || null;
    displayLeftPageNumber = currentPageIndex + 1;
    
    // Right side of current spread
    baseRightData = bookPages[currentPageIndex + 1] || null;
    baseRightPageNumber = currentPageIndex + 2;
    
    // Flipping page (the right page that's turning)
    flipperFrontData = bookPages[currentPageIndex + 1] || null;
    flipperFrontPageNumber = currentPageIndex + 2;
    
    // Next spread's left page (back of the flipping page)
    flipperBackData = bookPages[currentPageIndex + 2] || null;
    flipperBackPageNumber = currentPageIndex + 3;
  } else {
    // Backward direction - showing previous spread
    displayLeftPageData = bookPages[currentPageIndex] || null;
    displayLeftPageNumber = currentPageIndex + 1;
    
    baseRightData = bookPages[currentPageIndex + 1] || null;
    baseRightPageNumber = currentPageIndex + 2;
    
    // The page that's flipping back (was on the right, now flipping to show previous spread)
    flipperFrontData = bookPages[currentPageIndex + 1] || null;
    flipperFrontPageNumber = currentPageIndex + 2;
    
    // The back of the flipping page (which becomes the new right page of previous spread)
    flipperBackData = bookPages[currentPageIndex - 1] || null;
    flipperBackPageNumber = currentPageIndex;
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4 py-4", className)}>
      {/* Progress and title */}
      <div className="text-center mb-3">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">{title}</h2>
        <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1.5 shadow-sm">
          <div className="text-xs font-medium text-stone-700 dark:text-stone-200">
            Page {Math.floor(currentPageIndex/2) + 1} of {Math.ceil(totalPages/2)}
          </div>
          <div className="w-24 h-1 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentPageIndex + 2) / totalPages) * 100}%` }}
            />
          </div>
          <Bookmark className="h-3 w-3 text-amber-500" />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 opacity-80">
          Use ← → keys, swipe, or click page edges to turn.
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0 || isFlipping}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-black rounded-xl transition-all duration-200 transform hover:scale-110 hover:-translate-y-1",
            "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white",
            "border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[2px_2px_0px_0px_#666]",
            "active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000]"
          )}
        >
          <ArrowLeftCircle className="h-5 w-5" />
          <span className="font-black tracking-wide">PREVIOUS</span>
        </button>
        
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex + 2 >= totalPages || isFlipping}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-black rounded-xl transition-all duration-200 transform hover:scale-110 hover:-translate-y-1",
            "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white",
            "border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[2px_2px_0px_0px_#666]",
            "active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000]"
          )}
        >
          <span className="font-black tracking-wide">NEXT</span>
          <ArrowRightCircle className="h-5 w-5" />
        </button>
      </div>

      {/* The book */}
      <div className="flex justify-center">
        <div 
          ref={bookRef}
          className="relative w-full max-w-5xl bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-xl border-8 border-black shadow-2xl overflow-hidden perspective-1000"
          style={{ 
            boxShadow: "0 0 0 4px #fff, 0 0 0 8px #000, 8px 8px 0 8px #000, 16px 16px 30px rgba(0,0,0,0.4)",
            height: "clamp(600px, 70vh, 900px)",
            aspectRatio: "16/10",
            background: "linear-gradient(45deg, #FFD700 0%, #FF6B35 25%, #F7931E 50%, #FF6B35 75%, #FFD700 100%)"
          }}
        >
          {/* Comic book halftone pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #000 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, #000 1px, transparent 1px)`,
              backgroundSize: "20px 20px, 15px 15px"
            }}
          />
          
          <div className="flex w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
          
          <div className="w-1/2 h-full relative bg-gradient-to-br from-blue-50 to-cyan-100 flex flex-col p-8 md:p-10 shadow-sm border-r-4 border-black">
            <PageDisplay page={displayLeftPageData} pageNumber={displayLeftPageNumber} />
          </div>

          <div className="w-1/2 h-full relative" style={{ transformStyle: "preserve-3d" }}>
            
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-100 flex flex-col p-8 md:p-10 shadow-inner">
              <PageDisplay page={baseRightData} pageNumber={baseRightPageNumber} />
            </div>

            <AnimatePresence>
              {isFlipping && (
                <motion.div 
                  className="absolute inset-0 bg-black/30 dark:bg-black/50" 
                  initial={{ opacity: 0 }} 
                  animate={{ 
                    opacity: isFlipping ? 0.2 : 0, 
                    transition: { duration: animationDuration * 0.3, delay: animationDuration * 0.15 } 
                  }} 
                  exit={{ opacity: 0, transition: { duration: animationDuration * 0.25, delay: 0 } }} 
                  style={{ zIndex: 10 }} 
                />
              )}
            </AnimatePresence>

            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d", transformOrigin: "left center" }}
              initial={{ rotateY: 0, rotateX: 0, translateZ: 0, zIndex: 5 }} 
              animate={flipperControls}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-100 flex flex-col p-8 md:p-10 shadow-lg border-4 border-black"
                style={{ backfaceVisibility: "hidden" }}
              >
                <PageDisplay page={flipperFrontData} pageNumber={flipperFrontPageNumber} />
              </div>

              <div 
                className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col p-8 md:p-10 shadow-lg border-4 border-black"
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <PageDisplay page={flipperBackData} pageNumber={flipperBackPageNumber} />
              </div>
            </motion.div>
          </div>
          </div>

          {/* Click areas for page turning */}
          <button 
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0 || isFlipping}
            className="absolute left-0 top-0 w-1/6 h-full z-40 opacity-0 hover:opacity-10 bg-gradient-to-r from-blue-500/20 to-transparent transition-opacity cursor-pointer disabled:cursor-not-allowed"
            aria-label="Previous page"
          />
          <button 
            onClick={handleNextPage}
            disabled={currentPageIndex + 2 >= totalPages || isFlipping}
            className="absolute right-0 top-0 w-1/6 h-full z-40 opacity-0 hover:opacity-10 bg-gradient-to-l from-red-500/20 to-transparent transition-opacity cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next page"
          />
        </div>
      </div>

      {/* Audio element for page turn sound */}
      <audio
        ref={pageTurnSoundRef}
        src="/sounds/placeholder-page-turn.mp3"
        preload="metadata"
        className="hidden"
      />
    </div>
  );
} 