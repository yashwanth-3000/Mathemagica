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

      <div className="mb-2 pb-2 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center text-xs font-mono text-amber-600 dark:text-amber-400 mb-0.5 tracking-wider">
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
          <span className="truncate">
            {page.type === 'story' ? 'STORY' : page.type === 'image' ? 'COMIC ART' : 'COMIC PANEL'}
          </span>
        </div>
        <h2 className="text-md md:text-lg font-semibold text-stone-800 dark:text-stone-100 leading-tight truncate" title={page.title}>
          {page.title}
        </h2>
      </div>
      
      <div className="relative w-full flex-1 bg-stone-50/50 dark:bg-stone-800/60 rounded-md overflow-hidden shadow-inner">
        {page.type === 'story' && page.content ? (
          <div className="h-full p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-stone-200">
            <div className="prose prose-base prose-stone dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ ...props}) => <p className="mb-4 text-stone-700 dark:text-stone-300 leading-relaxed text-base" {...props} />,
                  h1: ({ ...props}) => <h1 className="text-xl font-bold my-4 text-amber-700 dark:text-amber-400" {...props} />,
                  h2: ({ ...props}) => <h2 className="text-lg font-semibold my-3 text-amber-600 dark:text-amber-300" {...props} />,
                  h3: ({ ...props}) => <h3 className="text-md font-semibold my-2 text-amber-600 dark:text-amber-300" {...props} />,
                  strong: ({ ...props}) => <strong className="font-bold text-stone-800 dark:text-stone-200" {...props} />,
                  em: ({ ...props}) => <em className="italic text-stone-600 dark:text-stone-400" {...props} />,
                }}
              >
                {page.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (page.type === 'image' || page.type === 'mixed') && page.image ? (
          <div className="h-full flex flex-col p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-stone-200">
            {/* Image Section */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-full bg-stone-200 dark:bg-stone-700 rounded-lg overflow-hidden shadow-lg" style={{ minHeight: '300px', maxHeight: '500px' }}>
                <Image 
                  src={page.image.src}
                  alt={page.image.title}
                  layout="fill"
                  objectFit="contain"
                  className="w-full h-full"
                />
              </div>
            </div>
            
            {/* Story Section at Bottom */}
            {page.content && (
              <div className="flex-1 bg-stone-50/50 dark:bg-stone-800/60 rounded-md p-4 shadow-inner border-t-2 border-amber-200 dark:border-amber-600">
                <div className="prose prose-sm prose-stone dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ ...props}) => <p className="mb-3 text-stone-700 dark:text-stone-300 leading-relaxed text-sm" {...props} />,
                      h1: ({ ...props}) => <h1 className="text-lg font-bold my-3 text-amber-700 dark:text-amber-400" {...props} />,
                      h2: ({ ...props}) => <h2 className="text-md font-semibold my-2 text-amber-600 dark:text-amber-300" {...props} />,
                      h3: ({ ...props}) => <h3 className="text-sm font-semibold my-2 text-amber-600 dark:text-amber-300" {...props} />,
                      strong: ({ ...props}) => <strong className="font-bold text-stone-800 dark:text-stone-200" {...props} />,
                      em: ({ ...props}) => <em className="italic text-stone-600 dark:text-stone-400" {...props} />,
                    }}
                  >
                    {page.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400 dark:text-stone-500">
            <p className="text-sm">No content available</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end mt-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
        <div className="text-stone-500 dark:text-stone-400 font-mono tracking-wider">COMIC BOOK</div>
        <div className="font-serif text-amber-700 dark:text-amber-500">{pageNumber.toString().padStart(2, '0')}</div>
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
    if (currentPageIndex + 1 < totalPages && !isFlipping) {
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
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {/* Progress and title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-4">{title}</h2>
        <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md border border-stone-200 dark:border-stone-700 rounded-full px-4 py-2 shadow-sm">
          <div className="text-xs font-medium text-stone-700 dark:text-stone-200">
            Page {Math.floor(currentPageIndex/2) + 1} of {Math.ceil(totalPages/2)}
          </div>
          <div className="w-28 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentPageIndex + 2) / totalPages) * 100}%` }}
            />
          </div>
          <Bookmark className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 opacity-80">
          Use ← → keys, swipe, or click page edges to turn.
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0 || isFlipping}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ArrowLeftCircle className="h-4 w-4" />
          Previous
        </button>
        
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex + 1 >= totalPages || isFlipping}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Next
          <ArrowRightCircle className="h-4 w-4" />
        </button>
      </div>

      {/* The book */}
      <div 
        ref={bookRef}
        className="relative w-full h-[1000px] mx-auto bg-gradient-to-br from-amber-100/80 to-orange-200/60 dark:from-stone-800/80 dark:to-stone-900/90 rounded-2xl border-4 border-amber-800/30 dark:border-stone-600/50 shadow-2xl overflow-hidden perspective-1000"
        style={{ 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)" 
        }}
      >
        <div className="flex w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
          
          <div className="w-1/2 h-full relative bg-stone-50 dark:bg-neutral-800/80 flex flex-col p-8 md:p-10 shadow-sm border-r border-stone-200/50 dark:border-stone-700/30">
            <PageDisplay page={displayLeftPageData} pageNumber={displayLeftPageNumber} />
          </div>

          <div className="w-1/2 h-full relative" style={{ transformStyle: "preserve-3d" }}>
            
            <div className="absolute inset-0 bg-stone-50 dark:bg-neutral-800/80 flex flex-col p-8 md:p-10 shadow-inner">
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
                className="absolute inset-0 bg-stone-50 dark:bg-neutral-800/90 flex flex-col p-8 md:p-10 shadow-lg dark:shadow-stone-950/30"
                style={{ backfaceVisibility: "hidden" }}
              >
                <PageDisplay page={flipperFrontData} pageNumber={flipperFrontPageNumber} />
              </div>

              <div 
                className="absolute inset-0 bg-stone-50 dark:bg-neutral-800/90 flex flex-col p-8 md:p-10 shadow-lg dark:shadow-stone-950/30"
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
          className="absolute left-0 top-0 w-1/6 h-full z-40 opacity-0 hover:opacity-5 bg-gradient-to-r from-blue-500/10 to-transparent transition-opacity cursor-pointer disabled:cursor-not-allowed"
          aria-label="Previous page"
        />
        <button 
          onClick={handleNextPage}
          disabled={currentPageIndex + 1 >= totalPages || isFlipping}
          className="absolute right-0 top-0 w-1/6 h-full z-40 opacity-0 hover:opacity-5 bg-gradient-to-l from-blue-500/10 to-transparent transition-opacity cursor-pointer disabled:cursor-not-allowed"
          aria-label="Next page"
        />
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