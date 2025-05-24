"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllBooks } from "../../lib/database";
import { Book } from "../../lib/supabase";
import { BookOpen, Calendar, Image as ImageIcon, Eye, SparklesIcon, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Glow } from "@/components/ui/glow";
import { cn } from "@/lib/utils";

// Status colors for comic book feel
const statusColors = {
  'completed': 'from-green-400 to-emerald-500',
  'in_progress': 'from-yellow-400 to-orange-500',
  'published': 'from-blue-400 to-cyan-500',
  'draft': 'from-gray-400 to-gray-500',
  'default': 'from-purple-400 to-pink-500'
};

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllBooks();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setBooks(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageCount = (book: Book) => {
    if (Array.isArray(book.images)) {
      return book.images.length;
    }
    return 0;
  };

  const getBookThumbnail = (book: Book) => {
    if (Array.isArray(book.images) && book.images.length > 0) {
      // Try to find any image with a valid URL
      for (const img of book.images) {
        const imageData = img as Record<string, unknown>;
        
        // Check for url property (main format used in database)
        if (imageData.url && typeof imageData.url === 'string') {
          return imageData.url;
        }
        
        // Fallback checks for other possible formats
        if (imageData.base64 && typeof imageData.base64 === 'string') {
          return `data:image/png;base64,${imageData.base64}`;
        }
        if (imageData.imageBase64 && typeof imageData.imageBase64 === 'string') {
          return `data:image/png;base64,${imageData.imageBase64}`;
        }
        if (imageData.src && typeof imageData.src === 'string' && imageData.src.startsWith('data:image/')) {
          return imageData.src;
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen text-slate-100 overflow-hidden relative flex items-center justify-center"
        style={{
          backgroundImage: "url('/comic_background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-200/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
          </div>
          <p className="text-amber-300 font-bold text-lg">Loading your comic library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen text-slate-100 overflow-hidden relative flex items-center justify-center"
        style={{
          backgroundImage: "url('/comic_background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        <div className="text-center">
          <div className="relative inline-block transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-8 rounded-2xl border-4 border-black shadow-2xl">
              <p className="text-red-600 dark:text-red-400 text-lg mb-4 font-bold">Error loading library: {error}</p>
              <Button 
                onClick={loadBooks}
                variant="glow"
                className="px-6 py-3 text-lg font-bold transform hover:scale-105 transition-all duration-300"
              >
                🔄 Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-slate-100 overflow-hidden relative"
      style={{
        backgroundImage: "url('/comic_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Decorative floating elements */}
      <div className="absolute top-10 left-[5%] w-40 h-40 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-[30%] right-[5%] w-60 h-60 bg-sky-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-[60%] left-[10%] w-32 h-32 bg-rose-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-[20%] right-[15%] w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Main content */}
      <div className="relative z-10 p-4 md:p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header with comic book styling */}
          <header className="mb-12 text-center">
            <Badge 
              variant="outline" 
              className="mb-6 gap-2 hover-scale bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-amber-400/80 shadow-lg transform -rotate-1 hover:rotate-0 transition-all duration-300"
            >
              <BookOpen className="h-4 w-4 text-amber-600" />
              <span className="text-neutral-700 dark:text-neutral-200 font-bold">Your Collection</span>
              <SparklesIcon className="h-4 w-4 text-amber-600" />
            </Badge>

            <div className="relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-300 ease-in-out my-6">
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-sans text-center text-black bg-yellow-100 dark:bg-orange-100 p-4 sm:p-6 md:p-8 border-4 border-black rounded-lg shadow-2xl shadow-black/60 dark:shadow-black/80 inline-block"
              >
                📚 YOUR LIBRARY!
              </h1>
            </div>

            <div className="relative z-10 max-w-xl md:max-w-2xl mx-auto mt-6 transform rotate-1 hover:rotate-0 transition-transform duration-300 ease-in-out">
              <p 
                className="font-sans font-bold text-lg md:text-xl text-black dark:text-yellow-50 bg-yellow-50 dark:bg-neutral-800 p-4 sm:p-5 border-[3px] border-black dark:border-yellow-300 rounded-lg shadow-xl shadow-neutral-700/50 dark:shadow-black/60 backdrop-blur-sm"
              >
                Your collection of AI-generated comic books and stories! 
                <br />
                <span className="text-amber-600 dark:text-amber-400">📖 {books.length} book{books.length !== 1 ? 's' : ''} • 🎨 Adventures • 🚀 Learning</span>
              </p>
            </div>
          </header>

          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/">
              <Button 
                variant="glow"
                className="font-bold transform hover:scale-105 transition-all duration-300 shadow-lg border-2 border-black hover:border-amber-400"
              >
                ← Back to Home
              </Button>
            </Link>
            <Link href="/explore">
              <Button 
                variant="glow"
                className="font-bold transform hover:scale-105 transition-all duration-300 shadow-lg border-2 border-black hover:border-amber-400"
              >
                🔍 Explore Comics
              </Button>
            </Link>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-8 rounded-2xl border-4 border-black shadow-2xl">
                  <BookOpen className="w-24 h-24 mx-auto text-amber-500 mb-6" />
                  <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200 mb-3 font-comic">
                    NO BOOKS YET!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 font-bold">
                    Create your first comic book to start your library!
                  </p>
                  <Link href="/">
                    <Button 
                      variant="glow" 
                      size="lg"
                      className="px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    >
                      <SparklesIcon className="mr-2 h-5 w-5" />
                      Create Your First Comic
                      <Zap className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {books.map((book, index) => (
                <div 
                  key={book.id} 
                  className={cn(
                    "group relative overflow-hidden transform transition-all duration-500 hover:scale-105 hover:-rotate-1",
                    "bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-black",
                    "hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] hover:border-amber-400"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Status badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <Badge 
                      className={cn(
                        "font-bold text-black border-2 border-black shadow-md transform -rotate-3 group-hover:rotate-0 transition-transform duration-300",
                        `bg-gradient-to-r ${statusColors[book.status as keyof typeof statusColors] || statusColors.default}`
                      )}
                    >
                      {book.status || 'draft'}
                    </Badge>
                  </div>

                  {/* Image count badge */}
                  <div className="absolute top-3 right-3 z-20">
                    <Badge 
                      className="font-bold text-black bg-white/90 border-2 border-black shadow-md transform rotate-3 group-hover:rotate-0 transition-transform duration-300"
                    >
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {getImageCount(book)}
                    </Badge>
                  </div>

                  {/* Cover Image or Placeholder */}
                  {getBookThumbnail(book) ? (
                    <div className="w-full h-48 relative overflow-hidden border-b-4 border-black">
                      <Image 
                        src={getBookThumbnail(book)!} 
                        alt={`Cover for ${book.title}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        width={192}
                        height={256}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center border-b-4 border-black relative overflow-hidden">
                      <BookOpen className="w-16 h-16 text-black/70 transform group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Comic book style halftone effect */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_transparent_40%,_black_40%,_black_60%,_transparent_60%)] bg-[length:8px_8px]" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 relative">
                    <h3 className="text-xl md:text-2xl font-black font-comic text-slate-800 dark:text-purple-300 mb-3 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300 line-clamp-2">
                      {book.title}
                    </h3>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-20 overflow-hidden font-medium leading-relaxed line-clamp-3">
                      {book.story_content.slice(0, 150)}...
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          {book.created_at ? formatDate(book.created_at) : 'Unknown'}
                        </span>
                      </div>
                      <span className="text-emerald-500 font-black">
                        {book.book_progress || 0}% complete
                      </span>
                    </div>

                    {/* Read button */}
                    <Link href={`/book/${book.id}`}> 
                      <Button 
                        variant="glow"
                        className="w-full font-bold transform group-hover:scale-105 transition-all duration-300 shadow-md group-hover:shadow-lg border-2 border-black hover:border-amber-400"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        READ COMIC
                        <SparklesIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Comic book style decoration */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400 border-l-4 border-b-4 border-black transform rotate-45 translate-x-4 -translate-y-4 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          )}

          {/* Add Glow effect */}
          <div className="relative mt-16">
            <Glow
              variant="top"
              className="opacity-60"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 