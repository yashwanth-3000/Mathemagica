import Link from "next/link";
import { Book, ArrowLeft } from "lucide-react";
import { Book as BookComponent } from "@/components/ui/book";

export default function BookPage() {
  return (
    <main className="container mx-auto px-4 py-20">
      {/* Back button */}
      <Link 
        href="/" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
      </Link>
      
      <div className="max-w-4xl mx-auto py-12">
        <div className="flex items-center justify-center gap-3 mb-10 text-center">
          <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)] border border-[hsl(var(--brand)/0.2)]">
            <Book className="h-6 w-6 text-[hsl(var(--brand))]" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-[hsl(var(--brand))] to-muted-foreground bg-clip-text text-transparent">
            BookHub
          </h1>
        </div>
        
        {/* Book Component */}
        <div className="mb-10">
          <BookComponent />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[hsl(var(--brand)/0.02)] rounded-full blur-3xl animate-pulse-slow opacity-70" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[hsl(var(--brand)/0.02)] rounded-full blur-3xl animate-float opacity-70" style={{ animationDelay: "1.5s" }} />
      </div>
    </main>
  );
} 