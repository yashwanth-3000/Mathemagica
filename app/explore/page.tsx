'use client';

import Link from 'next/link';
import { BookOpen, Search, SparklesIcon, Zap, Heart, Eye } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Glow } from "@/components/ui/glow";
import { cn } from "@/lib/utils";

// Placeholder data structure for a comic book
interface ComicBookEntry {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  createdAt: string;
  likes?: number;
  views?: number;
  category?: string;
}

// Enhanced placeholder comic data with more comic book feel
const placeholderComics: ComicBookEntry[] = [
  {
    id: '1',
    title: 'The Adventures of Captain Circuit ⚡',
    description: 'Join Captain Circuit as he battles the forces of electrical resistance! A thrilling journey through the world of electricity, circuits, and electromagnetic fields.',
    coverImageUrl: '/placeholder_comic_1.png',
    createdAt: '2024-03-10',
    likes: 42,
    views: 156,
    category: 'Physics'
  },
  {
    id: '2',
    title: 'Fraction Force to the Rescue! 🦸‍♀️',
    description: 'When parts of a whole are in trouble, the Fraction Force assembles! Watch as our heroes divide, multiply, and conquer mathematical mayhem.',
    coverImageUrl: '/placeholder_comic_2.png',
    createdAt: '2024-03-12',
    likes: 38,
    views: 203,
    category: 'Mathematics'
  },
  {
    id: '3',
    title: 'The Mystery of the Missing Molecule 🔬',
    description: 'Detective Chemistry investigates the case of the vanishing molecule! A chemistry caper filled with atomic adventures and elemental excitement.',
    createdAt: '2024-03-15',
    likes: 29,
    views: 98,
    category: 'Chemistry'
  },
  {
    id: '4',
    title: 'Geometry Galaxy Warriors 🌌',
    description: 'In a universe where shapes have power, our geometric heroes must save their dimension from the chaos of the Anti-Angle Alliance!',
    createdAt: '2024-03-18',
    likes: 51,
    views: 187,
    category: 'Geometry'
  },
  {
    id: '5',
    title: 'The Algebra Avengers 🦹‍♂️',
    description: 'X marks the spot for adventure! Follow our algebraic heroes as they solve for the unknown and balance the equations of justice.',
    createdAt: '2024-03-20',
    likes: 45,
    views: 142,
    category: 'Algebra'
  },
  {
    id: '6',
    title: 'Probability Pirates 🏴‍☠️',
    description: 'Ahoy! Captain Chance and his crew sail the statistical seas, where every treasure hunt is a lesson in probability and luck!',
    createdAt: '2024-03-22',
    likes: 33,
    views: 124,
    category: 'Statistics'
  }
];

// Category colors for comic book feel
const categoryColors = {
  'Physics': 'from-blue-400 to-cyan-500',
  'Mathematics': 'from-purple-400 to-pink-500',
  'Chemistry': 'from-green-400 to-emerald-500',
  'Geometry': 'from-yellow-400 to-orange-500',
  'Algebra': 'from-red-400 to-rose-500',
  'Statistics': 'from-indigo-400 to-purple-500',
  'default': 'from-gray-400 to-gray-500'
};

export default function ExplorePage() {
  const savedComics = placeholderComics;

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
              <SparklesIcon className="h-4 w-4 text-amber-600" />
              <span className="text-neutral-700 dark:text-neutral-200 font-bold">Comic Library</span>
              <Zap className="h-4 w-4 text-amber-600" />
            </Badge>

            <div className="relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-300 ease-in-out my-6">
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-sans text-center text-black bg-yellow-100 dark:bg-orange-100 p-4 sm:p-6 md:p-8 border-4 border-black rounded-lg shadow-2xl shadow-black/60 dark:shadow-black/80 inline-block"
              >
                EXPLORE COMICS!
              </h1>
            </div>

            <div className="relative z-10 max-w-xl md:max-w-2xl mx-auto mt-6 transform rotate-1 hover:rotate-0 transition-transform duration-300 ease-in-out">
              <p 
                className="font-sans font-bold text-lg md:text-xl text-black dark:text-yellow-50 bg-yellow-50 dark:bg-neutral-800 p-4 sm:p-5 border-[3px] border-black dark:border-yellow-300 rounded-lg shadow-xl shadow-neutral-700/50 dark:shadow-black/60 backdrop-blur-sm"
              >
                Discover amazing comic adventures that make learning fun! 
                <br />
                <span className="text-amber-600 dark:text-amber-400">🦸‍♂️ Heroes • 🧪 Science • 📐 Math • 🚀 Adventure</span>
              </p>
            </div>
          </header>

          {savedComics.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-8 rounded-2xl border-4 border-black shadow-2xl">
                  <Search className="w-24 h-24 mx-auto text-amber-500 mb-6" />
                  <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200 mb-3 font-comic">
                    NO COMICS FOUND YET!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 font-bold">
                    The comic universe awaits your first creation!
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
              {savedComics.map((comic, index) => (
                <div 
                  key={comic.id} 
                  className={cn(
                    "group relative overflow-hidden transform transition-all duration-500 hover:scale-105 hover:-rotate-1",
                    "bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-black",
                    "hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] hover:border-amber-400"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Category badge */}
                  {comic.category && (
                    <div className="absolute top-3 left-3 z-20">
                      <Badge 
                        className={cn(
                          "font-bold text-black border-2 border-black shadow-md transform -rotate-3 group-hover:rotate-0 transition-transform duration-300",
                          `bg-gradient-to-r ${categoryColors[comic.category as keyof typeof categoryColors] || categoryColors.default}`
                        )}
                      >
                        {comic.category}
                      </Badge>
                    </div>
                  )}

                  {/* Cover Image or Placeholder */}
                  {comic.coverImageUrl ? (
                    <div className="w-full h-48 relative overflow-hidden border-b-4 border-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={comic.coverImageUrl} 
                        alt={`Cover for ${comic.title}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                    <h3 className="text-xl md:text-2xl font-black font-comic text-slate-800 dark:text-purple-300 mb-3 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300">
                      {comic.title}
                    </h3>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-20 overflow-hidden font-medium leading-relaxed">
                      {comic.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-500" />
                          {comic.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-blue-500" />
                          {comic.views || 0}
                        </span>
                      </div>
                      <span>{new Date(comic.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Read button */}
                    <Link href={`/book/${comic.id}`}> 
                      <Button 
                        variant="glow"
                        className="w-full font-bold transform group-hover:scale-105 transition-all duration-300 shadow-md group-hover:shadow-lg border-2 border-black hover:border-amber-400"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
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