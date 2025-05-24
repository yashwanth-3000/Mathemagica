import Link from "next/link";
import { PenLine, ArrowLeft } from "lucide-react";

export default function WritePaper() {
  return (
    <main className="container mx-auto px-4 py-20">
      {/* Back button */}
      <Link 
        href="/" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
      </Link>
      
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)] border border-[hsl(var(--brand)/0.2)]">
            <PenLine className="h-5 w-5 text-[hsl(var(--brand))]" />
          </div>
          <h1 className="text-3xl font-bold">Write Papeer</h1>
        </div>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            Use our advanced editor to create, format, and publish your research papers with ease.
          </p>
          
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Simple & Powerful Editor</h3>
              <p className="text-muted-foreground">
                Our markdown-based editor supports complex formatting, equations, citations, and more while remaining intuitive to use.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Collaboration</h3>
              <p className="text-muted-foreground">
                Invite colleagues to co-author, comment, or review your work in real-time with our powerful collaboration tools.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Citation Management</h3>
              <p className="text-muted-foreground">
                Easily add and format citations from our extensive database or import your own reference library.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Templates</h3>
              <p className="text-muted-foreground">
                Choose from various journal-specific templates to ensure your paper meets publication requirements.
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border p-6 bg-[hsl(var(--brand)/0.05)] text-center">
            <h3 className="text-xl font-semibold mb-3">Ready to start writing?</h3>
            <p className="mb-4">Our editor is designed to make academic writing enjoyable and efficient.</p>
            <button className="px-6 py-3 rounded-md bg-[hsl(var(--brand))] text-white font-medium hover:bg-[hsl(var(--brand)/0.9)] transition-colors">
              Launch Editor
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 