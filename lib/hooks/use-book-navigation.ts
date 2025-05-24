import { useState, useEffect, useCallback } from 'react';

type UseBookNavigationProps = {
  totalPages: number;
  initialPage?: number;
};

type UseBookNavigationReturn = {
  currentPage: number;
  flipping: boolean;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToPage: (pageNumber: number) => void;
};

export function useBookNavigation({
  totalPages,
  initialPage = 0,
}: UseBookNavigationProps): UseBookNavigationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [flipping, setFlipping] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 0 && pageNumber < totalPages && !flipping) {
      setFlipping(true);
      setCurrentPage(pageNumber);
      setTimeout(() => setFlipping(false), 500);
    }
  }, [totalPages, flipping]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1 && !flipping) {
      setFlipping(true);
      setCurrentPage(prev => prev + 1);
      setTimeout(() => setFlipping(false), 500);
    }
  }, [currentPage, totalPages, flipping]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0 && !flipping) {
      setFlipping(true);
      setCurrentPage(prev => prev - 1);
      setTimeout(() => setFlipping(false), 500);
    }
  }, [currentPage, flipping]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
      // Number keys 1-9 for direct page navigation (adjusted for 0-indexed pages)
      const pageNum = parseInt(e.key);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= Math.min(totalPages, 9)) {
        goToPage(pageNum - 1);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [goToNextPage, goToPrevPage, goToPage, totalPages]);

  // Touch swipe navigation
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Require a minimum swipe distance to trigger page turn (30px)
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        // Swipe left, go to next page
        goToNextPage();
      } else {
        // Swipe right, go to previous page
        goToPrevPage();
      }
    }
    
    setTouchStart(null);
  }, [touchStart, goToNextPage, goToPrevPage]);

  useEffect(() => {
    // Add touch event listeners to document to ensure they work
    // even when the user's finger moves outside the book component
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return {
    currentPage,
    flipping,
    goToNextPage,
    goToPrevPage,
    goToPage
  };
} 
 