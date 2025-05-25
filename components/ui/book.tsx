"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  Book as BookIcon, 
  Bookmark, 
  Atom, 
  InfinityIcon, 
  Percent, 
  Ruler, 
  Shapes, 
  Sigma, 
  Compass, 
  Image as ImageIcon, 
  ArrowLeftCircle,
  ArrowRightCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from 'next/image';

// Define book page content type
type PageContent = {
  id: string;
  title: string;
  concept: string;
  imageUrl: string;
  icon?: React.ElementType;
};

// Using full content for bookData directly in the component
const mathComicData: PageContent[] = [
  {
    id: "fractions",
    title: "The Mystery of Fraction Falls",
    concept: "Understanding Fractions",
    imageUrl: "https://picsum.photos/seed/fractions/800/1000",
    icon: Percent
  },
  {
    id: "geometry_shapes",
    title: "Geometry City's Great Shape Heist",
    concept: "Basic Geometric Shapes",
    imageUrl: "https://picsum.photos/seed/geometry/800/1000",
    icon: Shapes
  },
  {
    id: "concept_of_zero",
    title: "The Zero Zone Expedition",
    concept: "The Power of Zero & Number Line",
    imageUrl: "https://picsum.photos/seed/zero/800/1000",
    icon: Atom
  },
  {
    id: "percentages",
    title: "Count Percentage's Potion Panic",
    concept: "Calculating Percentages",
    imageUrl: "https://picsum.photos/seed/percentages/800/1000",
    icon: Percent
  },
  {
    id: "tessellations",
    title: "The Time-Traveling Tessellation Tile",
    concept: "Patterns & Tessellations",
    imageUrl: "https://picsum.photos/seed/tessellations/800/1000",
    icon: InfinityIcon
  },
  {
    id: "probability",
    title: "Probability Pirates & the Treasure of Chance",
    concept: "Introduction to Probability",
    imageUrl: "https://picsum.photos/seed/probability/800/1000",
    icon: Sigma
  },
  {
    id: "algebra_variables",
    title: "The Algebraic Alchemist's Unknown",
    concept: "Basic Algebra & Variables (Solving for X)",
    imageUrl: "https://picsum.photos/seed/algebra/800/1000",
    icon: Atom
  },
  {
    id: "measurement",
    title: "Measurement Mayhem at the Market Fair",
    concept: "Units of Measurement (Length, Weight, Volume)",
    imageUrl: "https://picsum.photos/seed/measurement/800/1000",
    icon: Ruler
  },
  {
    id: "data_analysis",
    title: "Data Dragons & the Quest for the Average",
    concept: "Mean, Median, Mode",
    imageUrl: "https://picsum.photos/seed/data/800/1000",
    icon: Sigma
  },
  {
    id: "coordinate_graphing",
    title: "The Graphing Griffin's Sky Path",
    concept: "Coordinate Plane & Basic Graphing",
    imageUrl: "https://picsum.photos/seed/graphing/800/1000",
    icon: Compass
  }
];

// Page component
const PageDisplay = ({ page, pageNumber }: { page: PageContent | null, pageNumber: number }) => {
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
  const IconComponent = page.icon || Atom;
  return (
    <>
      <div className="mb-2 pb-2 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center text-xs font-mono text-amber-600 dark:text-amber-400 mb-0.5 tracking-wider">
          <IconComponent className="inline-block h-3.5 w-3.5 mr-1.5 opacity-80 flex-shrink-0" />
          <span className="truncate">CONCEPT: {page.concept.toUpperCase()}</span>
        </div>
        <h1 className="text-md md:text-lg font-semibold text-stone-800 dark:text-stone-100 leading-tight truncate" title={page.title}>{page.title}</h1>
      </div>
      
      <div className="relative w-full aspect-[9/16] max-h-[calc(100%-90px)] bg-stone-200/70 dark:bg-stone-800/60 rounded-md overflow-hidden shadow-inner flex items-center justify-center">
        {page.imageUrl ? (
          <Image 
            src={page.imageUrl} 
            alt={`Comic page for ${page.title}`} 
            layout="fill" 
            objectFit="contain" 
            className="transition-opacity duration-300 opacity-0"
            onLoadingComplete={(image) => image.classList.remove('opacity-0')}
            priority={pageNumber <= 2} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-500">
            <ImageIcon size={40} className="opacity-50 mb-2"/>
            <p className="text-xs">Image not available</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end mt-auto pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
        <div className="text-stone-500 dark:text-stone-400 font-mono tracking-wider">MATHEMAGICA SERIES</div>
        <div className="font-serif text-amber-700 dark:text-amber-500">{pageNumber.toString().padStart(2, '0')}</div>
      </div>
    </>
  );
};

export function Book() {
  const bookRef = useRef<HTMLDivElement>(null);
  const pageTurnSoundRef = useRef<HTMLAudioElement>(null);

  const [isFlipping, setIsFlipping] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const flipperControls = useAnimation();
  const totalPages = mathComicData.length;
  const animationDuration = 1.2; // seconds

  const flippingPageTransition = useMemo(() => ({
    duration: animationDuration,
    ease: [0.33, 1, 0.68, 1], 
  }), [animationDuration]);

  const playPageTurnSound = () => {
    if (pageTurnSoundRef.current) {
      // Only attempt to play if the src is not the placeholder and seems valid
      const currentSrc = pageTurnSoundRef.current.src;
      if (currentSrc && !currentSrc.endsWith("/sounds/placeholder-page-turn.mp3") && pageTurnSoundRef.current.readyState >= 2) { // readyState 2 (HAVE_CURRENT_DATA) or higher means some data is loaded
        pageTurnSoundRef.current.currentTime = 0; // Rewind to start
        pageTurnSoundRef.current.play().catch(error => console.warn("Audio play error (might be okay if user hasn't interacted yet):", error));
      } else if (currentSrc && currentSrc.endsWith("/sounds/placeholder-page-turn.mp3")) {
        console.log("Page turn sound: Placeholder SRC detected. Please update to a real sound file in public/sounds/ and update the <audio> src in components/ui/book.tsx.");
      }
    }
  };

  const handleNextPage = useCallback(async () => {
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
  
  let displayLeftPageData: PageContent | null = null;
  let displayLeftPageNumber: number = 0;
  let flipperFrontData: PageContent | null = null;
  let flipperFrontPageNumber: number = 0;
  let flipperBackData: PageContent | null = null;
  let flipperBackPageNumber: number = 0;
  let baseRightData: PageContent | null = null;
  let baseRightPageNumber: number = 0;

  if (isFlipping) {
    if (flipDirection === 'forward') {
      displayLeftPageData = mathComicData[currentPageIndex];
      displayLeftPageNumber = currentPageIndex + 1;
      flipperFrontData = currentPageIndex + 1 < totalPages ? mathComicData[currentPageIndex + 1] : null;
      flipperFrontPageNumber = currentPageIndex + 2;
      flipperBackData = currentPageIndex + 2 < totalPages ? mathComicData[currentPageIndex + 2] : null;
      flipperBackPageNumber = currentPageIndex + 3;
      baseRightData = currentPageIndex + 3 < totalPages ? mathComicData[currentPageIndex + 3] : null;
      baseRightPageNumber = currentPageIndex + 4;
    } else { // backward
      displayLeftPageData = currentPageIndex - 2 >= 0 ? mathComicData[currentPageIndex - 2] : null;
      displayLeftPageNumber = currentPageIndex - 1;
      flipperFrontData = currentPageIndex - 1 >= 0 ? mathComicData[currentPageIndex - 1] : null;
      flipperFrontPageNumber = currentPageIndex;
      flipperBackData = currentPageIndex - 2 >= 0 ? mathComicData[currentPageIndex - 2] : null;
      flipperBackPageNumber = currentPageIndex - 1;
      baseRightData = currentPageIndex - 1 >= 0 ? mathComicData[currentPageIndex - 1] : null;
      baseRightPageNumber = currentPageIndex;
    }
  } else { // Not flipping (idle state)
    displayLeftPageData = mathComicData[currentPageIndex];
    displayLeftPageNumber = currentPageIndex + 1;
    flipperFrontData = currentPageIndex + 1 < totalPages ? mathComicData[currentPageIndex + 1] : null;
    flipperFrontPageNumber = currentPageIndex + 2;
    flipperBackData = null; 
    flipperBackPageNumber = 0;
    baseRightData = currentPageIndex + 1 < totalPages ? mathComicData[currentPageIndex + 1] : null;
    baseRightPageNumber = currentPageIndex + 2;
  }

  useEffect(() => {
    if (!isFlipping) {
      flipperControls.set({ rotateY: 0, rotateX: 0, translateZ: 0, zIndex: 5 });
    }
  }, [isFlipping, currentPageIndex, flipperControls]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleNextPage();
      } else if (event.key === 'ArrowLeft') {
        handlePrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNextPage, handlePrevPage]);

  return (
    <div className="relative w-full max-w-7xl mx-auto py-8">
      <audio ref={pageTurnSoundRef} src="/sounds/placeholder-page-turn.mp3" preload="auto" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-center mb-6"
      >
        <h2 className="text-3xl md:text-4xl font-semibold mb-2 text-stone-800 dark:text-stone-100">
          <BookIcon className="inline-block mr-2.5 mb-1.5 text-amber-600 dark:text-amber-500" size={36} />
          Mathemagica: The Comic Chronicles
        </h2>
        <p className="text-md text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
          Unlock the fun side of math with engaging comic stories and interactive adventures!
        </p>
      </motion.div>
      
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md border border-stone-200 dark:border-stone-700 rounded-full px-4 py-2 shadow-sm">
          <div className="text-xs font-medium text-stone-700 dark:text-stone-200">
            Adventures {currentPageIndex/2 + 1} of {totalPages/2}
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

      <motion.div 
        ref={bookRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative mx-auto max-w-6xl h-[600px] md:h-[700px]"
        style={{ perspective: "2000px" }} 
      >
        <div className="absolute inset-0 top-6 left-3 right-3 bottom-0 bg-black/10 dark:bg-black/20 blur-xl rounded-md transform scale-100 -z-10" />
        
        <div className="relative w-full h-full bg-stone-50 dark:bg-neutral-900/60 rounded-md shadow-lg border border-stone-200/70 dark:border-stone-700/50 overflow-hidden">
          
          <div className="absolute -top-0.5 left-2 right-2 h-full bg-stone-100 dark:bg-neutral-800/70 rounded-md -z-10 shadow-sm" />
          
          <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-stone-300 via-stone-200 to-stone-300 dark:from-stone-700 dark:via-stone-600 dark:to-stone-700 -translate-x-1/2 z-30 shadow-inner">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-stone-400/50 dark:bg-stone-500/50" />
          </div>

          <div className="flex w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
            
            <div className="w-1/2 h-full relative bg-stone-50 dark:bg-neutral-800/80 flex flex-col p-4 md:p-6 shadow-sm border-r border-stone-200/50 dark:border-stone-700/30">
              <PageDisplay page={displayLeftPageData} pageNumber={displayLeftPageNumber} />
            </div>

            <div className="w-1/2 h-full relative" style={{ transformStyle: "preserve-3d" }}>
              
              <div className="absolute inset-0 bg-stone-50 dark:bg-neutral-800/80 flex flex-col p-4 md:p-6 shadow-inner">
                <PageDisplay page={baseRightData} pageNumber={baseRightPageNumber} />
              </div>

              <AnimatePresence>
                {isFlipping && (
                  <motion.div className="absolute inset-0 bg-black/30 dark:bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: isFlipping ? 0.2 : 0, transition: { duration: animationDuration * 0.3, delay: animationDuration * 0.15 } }} exit={{ opacity: 0, transition: { duration: animationDuration * 0.25, delay: 0 } }} style={{ zIndex: 10 }} />
                )}
              </AnimatePresence>

              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d", transformOrigin: "left center" }}
                initial={{ rotateY: 0, rotateX: 0, translateZ: 0, zIndex: 5 }} 
                animate={flipperControls}
              >
                <div 
                  className="absolute inset-0 bg-stone-50 dark:bg-neutral-800/90 flex flex-col p-4 md:p-6 shadow-lg dark:shadow-stone-950/30"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <PageDisplay page={flipperFrontData} pageNumber={flipperFrontPageNumber} />
                </div>

                <div 
                  className="absolute inset-0 bg-stone-50 dark:bg-neutral-800/90 flex flex-col p-4 md:p-6 shadow-lg dark:shadow-stone-950/30"
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

          <button 
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0 || isFlipping}
            className="absolute left-0 top-0 w-1/6 h-full z-40 opacity-0 hover:opacity-5 bg-gradient-to-r from-blue-500/10 to-transparent transition-opacity cursor-pointer disabled:cursor-not-allowed"
            aria-label="Previous page"
          />
          <button 
            onClick={handleNextPage}
            disabled={currentPageIndex + 2 >= totalPages || isFlipping}
            className="absolute right-0 top-0 w-1/6 h-full z-40 opacity-0 hover:opacity-5 bg-gradient-to-l from-blue-500/10 to-transparent transition-opacity cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next page"
          />
        </div>

        <div className="flex justify-center items-center gap-4 mt-7">
          <motion.button 
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0 || isFlipping}
            whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-600 text-white text-sm font-medium shadow-md transition-all duration-200",
              (currentPageIndex === 0 || isFlipping) && "opacity-60 hover:filter-none filter brightness-75 cursor-not-allowed"
            )}
          >
            <ArrowLeftCircle className="h-5 w-5" />Previous
          </motion.button>
          
          <motion.button 
            onClick={handleNextPage}
            disabled={currentPageIndex + 2 >= totalPages || isFlipping}
            whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-2 pl-5 pr-4 py-2.5 rounded-full bg-amber-600 hover:bg-amber-600 text-white text-sm font-medium shadow-md transition-all duration-200",
              (currentPageIndex + 2 >= totalPages || isFlipping) && "opacity-60 hover:filter-none filter brightness-75 cursor-not-allowed"
            )}
          >
            Next<ArrowRightCircle className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
} 