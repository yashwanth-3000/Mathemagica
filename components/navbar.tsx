"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ChevronRight, Menu, Search, Zap, Sparkles, Compass } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  let navStyles = "";
  let logoIconWrapperStyles = "";
  let logoIconStyles = "";
  let logoTextStyles = "";
  let logoTextShadow = {};
  let navLinkStyles = "";
  let navLinkHoverStyles = "";
  let themeButtonStyles = "";
  let themeButtonIconStyles = "h-4 w-4";
  let signInButtonStyles = "";
  let mobileMenuButtonStyles = "";
  let mobileMenuIconStyles = "h-6 w-6";

  if (pathname === '/' || pathname === '/library') {
    navStyles = "bg-amber-500 border-b-4 border-black shadow-xl";
    logoIconWrapperStyles = "bg-black w-8 h-8 md:w-10 md:h-10";
    logoIconStyles = "text-amber-500 group-hover:text-white h-5 w-5 md:h-6 md:h-6";
    logoTextStyles = "text-black group-hover:text-red-600 font-extrabold text-xl md:text-2xl";
    logoTextShadow = { textShadow: "1px 1px 0 #FFF, -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 2px 2px 0 #000" };
    navLinkStyles = "text-black font-bold py-1";
    navLinkHoverStyles = "hover:bg-red-600 hover:text-amber-400 hover:border-black dark:hover:border-black";
    themeButtonStyles = "bg-black hover:bg-neutral-800 text-amber-500 border-2 border-amber-400 rounded-full w-9 h-9";
    themeButtonIconStyles = "h-4 w-4";
    signInButtonStyles = "bg-red-600 hover:bg-red-700 text-amber-400 border-2 border-black font-bold px-3 py-1.5 text-sm";
    mobileMenuButtonStyles = "text-black hover:bg-black/20 rounded-full";
    mobileMenuIconStyles = "h-5 w-5";
  } else {
    navStyles = "bg-neutral-900 border-b-4 border-amber-500 dark:border-red-500 shadow-xl";
    logoIconWrapperStyles = "bg-amber-500 dark:bg-red-500 w-8 h-8 md:w-10 md:h-10";
    logoIconStyles = "text-black dark:text-neutral-900 group-hover:text-neutral-700 dark:group-hover:text-black h-5 w-5 md:h-6 md:h-6";
    logoTextStyles = "text-amber-400 dark:text-red-400 group-hover:text-white dark:group-hover:text-amber-400 font-extrabold text-xl md:text-2xl";
    logoTextShadow = { textShadow: "2px 2px 0px rgba(0,0,0,0.7)" };
    navLinkStyles = "text-neutral-200 font-bold py-1";
    navLinkHoverStyles = "hover:bg-amber-500 dark:hover:bg-red-500 hover:text-black dark:hover:text-black hover:border-black dark:hover:border-neutral-900";
    themeButtonStyles = "bg-amber-500 hover:bg-amber-600 dark:bg-red-500 dark:hover:bg-red-600 text-black dark:text-neutral-900 border-2 border-black dark:border-neutral-900 rounded-full w-9 h-9";
    themeButtonIconStyles = "h-4 w-4";
    signInButtonStyles = "bg-amber-500 hover:bg-amber-600 dark:bg-red-500 dark:hover:bg-red-600 text-black dark:text-neutral-900 border-2 border-black font-bold px-3 py-1.5 text-sm";
    mobileMenuButtonStyles = "text-amber-400 dark:text-red-400 hover:bg-white/10 dark:hover:bg-black/20 rounded-full";
    mobileMenuIconStyles = "h-5 w-5";
  }

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Comics", href: "/book" },
    { name: "Library", href: "/library" },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-50 transition-colors duration-300",
        "h-16 md:h-20",
        navStyles
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-full px-4">
        <Link href="/" className="flex items-center group">
          <div className="flex flex-col">
            <span 
              className={cn("transition-colors duration-200 font-black font-sans tracking-tight leading-none", logoTextStyles)}
              style={{ 
                ...logoTextShadow
              }} 
            >
              Mathemagica
            </span>
            <span className="text-xs font-bold opacity-75 -mt-1" style={{ color: pathname === '/' || pathname === '/library' ? '#000' : '#fbbf24' }}>
              Comics & Learning
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          {[
            { name: "Home", href: "/" },
            { name: "Comics", href: "/book" },
            { name: "Library", href: "/library" },
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "px-3 rounded-md text-sm transform hover:scale-105 shadow-sm hover:shadow-md border-2 border-transparent transition-all duration-200 ease-in-out",
                navLinkStyles,
                navLinkHoverStyles
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 md:space-x-2">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200",
                themeButtonStyles
              )}
            >
              {theme === "dark" ? (
                <Sun className={cn(themeButtonIconStyles)} />
              ) : (
                <Moon className={cn(themeButtonIconStyles)} />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("md:hidden transform hover:scale-110 transition-transform duration-200", mobileMenuButtonStyles)}>
            <Menu className={cn(mobileMenuIconStyles)} />
          </Button>
        </div>
      </div>
    </nav>
  );
} 