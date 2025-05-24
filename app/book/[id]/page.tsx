"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getBook, getBookImages } from "../../../lib/database";
import { Book, BookImage } from "../../../lib/supabase";
import { ArrowLeft, Calendar, Image as ImageIcon } from "lucide-react";
import { DynamicBook } from "../../../components/ui/dynamic-book";

export default function BookView() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<Book | null>(null);
  const [bookImages, setBookImages] = useState<BookImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load book details
      const { data: bookData, error: bookError } = await getBook(bookId);
      if (bookError) {
        throw new Error(bookError.message);
      }
      
      // Load book images
      const { data: imagesData, error: imagesError } = await getBookImages(bookId);
      if (imagesError) {
        console.warn("Error loading images:", imagesError);
      }
      
      setBook(bookData);
      setBookImages(imagesData || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId, loadBook]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImagesFromBook = () => {
    if (!book) return [];
    
    const images = [];
    
    // Get images from JSONB field
    if (Array.isArray(book.images)) {
      images.push(...book.images.map((img, index: number) => {
        // Type guard to ensure img is an object with the expected properties
        const imgObj = img as Record<string, unknown>;
        return {
          id: (typeof imgObj.id === 'string' || typeof imgObj.id === 'number') ? imgObj.id : index,
          title: (imgObj.title as string) || `Image ${index + 1}`,
          base64: imgObj.base64 as string | undefined,
          url: imgObj.url as string | undefined,
          filePath: imgObj.filePath as string | undefined,
          prompt: imgObj.prompt as string | undefined
        };
      }));
    }
    
    return images;
  };

  // Parse story content into parts and extract chapter information
  const parseStoryContent = () => {
    if (!book?.story_content) return { storyParts: [], chapterName: '' };

    try {
      const storyContent = book.story_content;
      
      // Try to extract chapter name from the beginning (if it follows our format)
      // Look for patterns like "📖 Chapter Name" or just "Chapter Name" at the start
      const chapterMatch = storyContent.match(/^(?:📖\s*)?([^\n]+?)(?:\n|$)/);
      let chapterName = chapterMatch ? chapterMatch[1].trim() : '';
      
      // Remove emoji if present
      chapterName = chapterName.replace(/^📖\s*/, '');

      // Split story into parts by looking for "Part X:" patterns
      const partPattern = /Part\s+(\d+):\s*([^\n]+)\n([^]*?)(?=Part\s+\d+:|$)/gi;
      const storyParts: Array<{part_number: number, chapter_title: string, story_content: string}> = [];
      
      let match;
      while ((match = partPattern.exec(storyContent)) !== null) {
        const partNumber = parseInt(match[1]);
        const partTitle = match[2].trim();
        const partContent = match[3].trim();
        
        storyParts.push({
          part_number: partNumber,
          chapter_title: partTitle,
          story_content: partContent
        });
      }

      // If no parts found, try to split by double newlines and create parts
      if (storyParts.length === 0) {
        const paragraphs = storyContent.split('\n\n').filter(p => p.trim());
        
        // Skip the first paragraph if it looks like a chapter title/summary
        const startIndex = paragraphs.length > 3 ? 1 : 0;
        const contentParagraphs = paragraphs.slice(startIndex);
        
        // Group paragraphs into 3 parts
        const partSize = Math.ceil(contentParagraphs.length / 3);
        for (let i = 0; i < 3; i++) {
          const partContent = contentParagraphs
            .slice(i * partSize, (i + 1) * partSize)
            .join('\n\n');
          
          if (partContent.trim()) {
            storyParts.push({
              part_number: i + 1,
              chapter_title: `Part ${i + 1}`,
              story_content: partContent.trim()
            });
          }
        }
      }

      return { storyParts, chapterName };
    } catch (error) {
      console.warn('Error parsing story content:', error);
      return { storyParts: [], chapterName: '' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 dark:from-stone-900 dark:via-stone-800 dark:to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-700 dark:text-stone-300">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 dark:from-stone-900 dark:via-stone-800 dark:to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">
            {error || "Book not found"}
          </p>
          <button 
            onClick={() => router.push('/library')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const bookImagesFromJson = getImagesFromBook();
  const { storyParts, chapterName } = parseStoryContent();
  
  // Create a unified image type for the DynamicBook component
  const unifiedImages = [
    // Images from JSON field
    ...bookImagesFromJson.map(img => ({
      id: img.id,
      title: img.title,
      src: img.base64 ? `data:image/png;base64,${img.base64}` : (img.url || ''),
      base64: img.base64,
      prompt: img.prompt
    })),
    // Images from separate table
    ...bookImages.map(img => ({
      id: img.id,
      title: img.image_name || `Image ${img.image_order || 1}`,
      src: img.image_url,
      prompt: img.image_description || undefined
    }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 dark:from-stone-900 dark:via-stone-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/library')}
            className="flex items-center space-x-2 px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>
          
          <div className="flex items-center space-x-4 text-sm text-stone-600 dark:text-stone-400">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{book.created_at ? formatDate(book.created_at) : 'Unknown date'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ImageIcon className="w-4 h-4" />
              <span>{unifiedImages.length} images</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              book.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
              book.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
              book.status === 'published' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
              'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400'
            }`}>
              {book.status || 'draft'}
            </span>
          </div>
        </div>

        {/* Book Display */}
        <DynamicBook 
          title={book.title}
          story={book.story_content}
          images={unifiedImages}
          storyParts={storyParts}
          chapterName={chapterName}
          className="mb-8"
        />

      </div>
    </div>
  );
} 