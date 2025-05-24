"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { CheckCircle, Loader2, MessageSquareText, Image as ImageIcon, Sparkles, AlertTriangleIcon, ArrowRight, Palette, Database, BookOpen, Eye } from 'lucide-react'; // Icons
import { saveCompleteBook } from '../../lib/database';
import { DynamicBook } from '../../components/ui/dynamic-book';

// Matches the structure from the API (see imagePromptJsonSchema in route.ts)
interface PanelDetail {
  panel_number: number;
  description: string;
  dialogue_caption: string;
}

interface ParsedImagePrompt {
  id: number;
  title: string;
  panel_layout_description: string;
  panels: PanelDetail[];
  art_style_mood_notes: string;
}

// Interface for generated images
interface GeneratedImage {
  id: number;
  title: string;
  imageBase64: string;
  imageUrl?: string;
  savedFilePath?: string;
  prompt: string;
}

export default function BookProgress() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userPrompt = searchParams.get("prompt");

  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [currentStoryChunks, setCurrentStoryChunks] = useState("");
  const [finalStory, setFinalStory] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState<string | null>(null);
  const [storySummary, setStorySummary] = useState<string | null>(null);
  const [storyParts, setStoryParts] = useState<Array<{part_number: number, chapter_title: string, story_content: string}>>([]);
  const [finalImagePrompts, setFinalImagePrompts] = useState<ParsedImagePrompt[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Timeline stages state
  const [storyGenInProgress, setStoryGenInProgress] = useState(false);
  const [storyGenComplete, setStoryGenComplete] = useState(false);
  const [imagePromptGenInProgress, setImagePromptGenInProgress] = useState(false);
  const [imagePromptGenComplete, setImagePromptGenComplete] = useState(false);
  
  // New image generation states
  const [imageGenInProgress, setImageGenInProgress] = useState(false);
  const [imageGenComplete, setImageGenComplete] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imageGenStatus, setImageGenStatus] = useState("");
  
  // Database save states
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true); // Auto-scroll by default
  const hasProcessedPromptRef = useRef<string | null>(null); // Track processed prompts

  // Auto-scroll logic using useLayoutEffect for synchronization with DOM changes
  useEffect(() => {
    const container = storyContainerRef.current;
    if (!container) return;

    if (shouldScrollToBottomRef.current) {
      // Instantly scroll to the bottom
      container.scrollTop = container.scrollHeight;
    }

    // After rendering and potential scroll, update the flag for the next time.
    // If user has scrolled up, shouldScrollToBottomRef will become false.
    // If user scrolls back to bottom manually, it will become true.
    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consider a small threshold for being "at the bottom"
    shouldScrollToBottomRef.current = scrollHeight - scrollTop - clientHeight < 20;

  }, [currentStoryChunks]); // Re-evaluate on new story chunks

  // Image generation function
  const generateImages = async () => {
    if (finalImagePrompts.length === 0) return;
    
    setImageGenInProgress(true);
    setImageGenStatus("Starting image generation...");
    setCurrentImageIndex(0);
    
    for (let i = 0; i < finalImagePrompts.length; i++) {
      const prompt = finalImagePrompts[i];
      setCurrentImageIndex(i + 1);
      setImageGenStatus(`Generating image ${i + 1} of ${finalImagePrompts.length}: ${prompt.title}`);
      
      try {
        // Create a detailed prompt combining the description and art style
        const detailedPrompt = `${prompt.panel_layout_description} ${prompt.panels.map(p => p.description).join(' ')} ${prompt.art_style_mood_notes}`;
        
        const response = await fetch("/api/test-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: detailedPrompt,
            saveToFile: true,
            filename: `comic-image-${prompt.id}.png`
          }),
        });

        const data = await response.json();

        // Handle different types of errors
        if (!response.ok) {
          let errorMessage = data.error || `Failed to generate image ${i + 1}`;
          
          // Check for 502 Bad Gateway or OpenAI service issues
          if (response.status === 502 || errorMessage.includes("502") || errorMessage.includes("Bad gateway")) {
            console.warn(`OpenAI service temporarily unavailable for image ${i + 1}. Using placeholder.`);
            setImageGenStatus(`⚠️ OpenAI service temporarily down - using placeholder for image ${i + 1}`);
            
            // Create a placeholder image with comic book styling
            const placeholderImage: GeneratedImage = {
              id: prompt.id,
              title: prompt.title,
              imageBase64: await createPlaceholderImage(prompt.title, i + 1),
              imageUrl: undefined,
              savedFilePath: undefined,
              prompt: detailedPrompt
            };
            
            setGeneratedImages(prev => [...prev, placeholderImage]);
            setImageGenStatus(`📝 Placeholder created for image ${i + 1}: ${prompt.title}`);
            await new Promise(resolve => setTimeout(resolve, 800));
            continue;
          }
          
          throw new Error(errorMessage);
        }

        if (data.imageBase64) {
          const generatedImage: GeneratedImage = {
            id: prompt.id,
            title: prompt.title,
            imageBase64: data.imageBase64,
            imageUrl: data.imageUrl,
            savedFilePath: data.savedFilePath,
            prompt: detailedPrompt
          };
          
          setGeneratedImages(prev => [...prev, generatedImage]);
          setImageGenStatus(`✅ Image ${i + 1} generated successfully: ${prompt.title}`);
          
          // Brief pause to show success message
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          throw new Error(`No image data returned for image ${i + 1}`);
        }
      } catch (error: any) {
        console.error(`Error generating image ${i + 1}:`, error);
        
        // For any error, create a placeholder and continue
        console.warn(`Creating placeholder for image ${i + 1} due to error: ${error.message}`);
        setImageGenStatus(`⚠️ Creating placeholder for image ${i + 1} - ${error.message.slice(0, 50)}...`);
        
        try {
          const placeholderImage: GeneratedImage = {
            id: prompt.id,
            title: prompt.title,
            imageBase64: await createPlaceholderImage(prompt.title, i + 1),
            imageUrl: undefined,
            savedFilePath: undefined,
            prompt: `Placeholder for: ${prompt.title}`
          };
          
          setGeneratedImages(prev => [...prev, placeholderImage]);
          setImageGenStatus(`📝 Placeholder created for image ${i + 1}: ${prompt.title}`);
        } catch (placeholderError) {
          console.error(`Failed to create placeholder for image ${i + 1}:`, placeholderError);
          setImageGenStatus(`❌ Failed to create content for image ${i + 1}`);
        }
        
        // Continue with next image instead of stopping
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setImageGenInProgress(false);
    setImageGenComplete(true);
    setImageGenStatus(`🎉 Image generation complete! Generated ${generatedImages.length} images. Redirecting to your comic book...`);
  };

  // Function to create a placeholder image as base64
  const createPlaceholderImage = async (title: string, imageNumber: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        // Fallback: return a simple base64 encoded placeholder
        resolve('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        return;
      }
      
      canvas.width = 512;
      canvas.height = 512;
      
      // Comic book style background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#fbbf24'); // amber-400
      gradient.addColorStop(1, '#f59e0b'); // amber-500
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add comic book border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Add title text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Wrap text
      const words = title.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 40 && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine.trim());
      
      // Draw text lines
      const lineHeight = 30;
      const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });
      
      // Add image number
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Image ${imageNumber}`, canvas.width / 2, canvas.height - 30);
      
      // Add "Service Unavailable" text
      ctx.font = '16px Arial';
      ctx.fillStyle = '#dc2626'; // red-600
      ctx.fillText('(AI Service Temporarily Unavailable)', canvas.width / 2, canvas.height - 60);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      resolve(base64);
    });
  };

  // Function to save the book to Supabase
  const saveBookToDatabase = async () => {
    if (!finalStory || generatedImages.length === 0) {
      setSaveError("No story or images to save");
      return;
    }

    setSaveInProgress(true);
    setSaveError(null);

    try {
      // Use chapter name as title if available, otherwise fallback to user prompt
      const title = chapterName || userPrompt?.slice(0, 100) || finalStory.slice(0, 100) + "...";
      
      const { bookId, error } = await saveCompleteBook(
        title,
        finalStory, // This should be the full story, not the summary
        generatedImages,
        100, // Book progress is 100% since it's complete
        'completed'
      );

      if (error) {
        throw new Error(error.message || "Failed to save book");
      }

      setSavedBookId(bookId);
      setSaveComplete(true);
    } catch (error: any) {
      console.error("Error saving book:", error);
      setSaveError(error.message || "Failed to save book to database");
    } finally {
      setSaveInProgress(false);
    }
  };

  // Trigger image generation when image prompts are complete
  useEffect(() => {
    if (imagePromptGenComplete && finalImagePrompts.length > 0 && !imageGenInProgress && !imageGenComplete) {
      generateImages();
    }
  }, [imagePromptGenComplete, finalImagePrompts.length, imageGenInProgress, imageGenComplete]);

  // Auto-save when generation is complete
  useEffect(() => {
    if (imageGenComplete && finalStory && generatedImages.length > 0 && !saveInProgress && !saveComplete) {
      // Auto-save after a short delay
      const saveTimer = setTimeout(() => {
        saveBookToDatabase();
      }, 2000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [imageGenComplete, finalStory, generatedImages.length, saveInProgress, saveComplete]);

  useEffect(() => {
    if (!userPrompt) {
      setStatus("No prompt provided. Redirecting to home...");
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    // Prevent duplicate processing of the same prompt
    if (hasProcessedPromptRef.current === userPrompt) {
      return;
    }

    // Mark this prompt as being processed
    hasProcessedPromptRef.current = userPrompt;

    // Reset states for new prompt processing
    setStatus("Initializing...");
    setError(null);
    setCurrentStoryChunks("");
    setFinalStory(null);
    setChapterName(null);
    setStorySummary(null);
    setStoryParts([]);
    setFinalImagePrompts([]);
    setIsComplete(false);
    setStoryGenInProgress(false);
    setStoryGenComplete(false);
    setImagePromptGenInProgress(false);
    setImagePromptGenComplete(false);
    setImageGenInProgress(false);
    setImageGenComplete(false);
    setCurrentImageIndex(0);
    setGeneratedImages([]);
    setImageGenStatus("");
    setSaveInProgress(false);
    setSaveComplete(false);
    setSaveError(null);
    setSavedBookId(null);
    shouldScrollToBottomRef.current = true; // Reset auto-scroll for new prompt

    const processBookStream = async () => {
      try {
        setStatus(`Verifying prompt: "${userPrompt}"`);
        // Set story generation as in progress immediately
        setStoryGenInProgress(true);

        const response = await fetch("/api/comic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userPrompt }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error response from server" }));
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }

        if (!response.body) throw new Error("ReadableStream not available");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedStory = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const rawData = decoder.decode(value);
          const messages = rawData.split("\n\n").filter(msg => msg.startsWith("data: "));

          for (const message of messages) {
            try {
              const jsonString = message.substring("data: ".length);
              const eventData = JSON.parse(jsonString);

              if (eventData.type === "status") {
                setStatus(eventData.message);
                if(eventData.message.includes("Generating story")) {
                    setStoryGenInProgress(true);
                }
                if(eventData.message.includes("Story generation complete")) {
                    setStoryGenInProgress(false);
                    setStoryGenComplete(true);
                }
                if(eventData.message.includes("Generating image prompts as JSON")) {
                    setImagePromptGenInProgress(true);
                }
                if(eventData.message.includes("Image prompts parsed. Streaming individual prompts...")) {
                    // This status indicates the start of individual prompt streaming
                    // We can ensure imagePromptGenInProgress is true and imagePromptGenComplete is false
                    if(storyGenInProgress) setStoryGenInProgress(false); // story should be done
                    if(!storyGenComplete) setStoryGenComplete(true);  // mark story complete
                    setImagePromptGenInProgress(true);
                    setImagePromptGenComplete(false); // Not yet complete until done event
                }
              } else if (eventData.type === "story_summary") {
                if (!storyGenInProgress && !storyGenComplete) setStoryGenInProgress(true);
                setChapterName(eventData.chapter_name);
                setStorySummary(eventData.summary);
                setCurrentStoryChunks(eventData.summary); // Start with summary
              } else if (eventData.type === "story_part") {
                // Add individual story parts as they come in
                if (!storyGenInProgress && !storyGenComplete) setStoryGenInProgress(true);
                setStoryParts(prev => [...prev, {
                  part_number: eventData.part_number,
                  chapter_title: eventData.chapter_title,
                  story_content: eventData.story_content
                }]);
              } else if (eventData.type === "image_prompt_item") {
                // New event type for individual image prompts
                if (!imagePromptGenInProgress && !imagePromptGenComplete) {
                     // If we missed the status update, ensure correct state
                    if(storyGenInProgress) setStoryGenInProgress(false);
                    if(!storyGenComplete) setStoryGenComplete(true);
                    setImagePromptGenInProgress(true);
                }
                setFinalImagePrompts(prev => [...prev, eventData.item]);
              } else if (eventData.type === "done") {
                setStatus("Comic generation complete! Finalizing display...");
                if(storyGenInProgress) setStoryGenInProgress(false);
                if(!storyGenComplete) setStoryGenComplete(true);
                if(imagePromptGenInProgress) setImagePromptGenInProgress(false);
                setImagePromptGenComplete(true);

                // Create final story from story parts if available
                let finalStoryContent = eventData.story || accumulatedStory;
                if (storyParts.length > 0) {
                  finalStoryContent = storyParts.map(part => 
                    `Part ${part.part_number}: ${part.chapter_title}\n${part.story_content}`
                  ).join('\n\n');
                }
                
                setFinalStory(finalStoryContent);
                if (eventData.chapterName) setChapterName(eventData.chapterName);
                if (eventData.storySummary) setStorySummary(eventData.storySummary);
                
                return; 
              } else if (eventData.type === "error") {
                throw new Error(eventData.error || "Unknown streaming error from server");
              }
            } catch (parseError) {
              console.error("Error parsing SSE message or handling event:", parseError, "Raw message:", message);
              setError("Error processing data from server. Check console.");
              setIsComplete(true); // Stop further processing on critical parse error
              if(storyGenInProgress) setStoryGenInProgress(false);
              if(imagePromptGenInProgress) setImagePromptGenInProgress(false);
              setStoryGenComplete(true); // Mark as complete to show error in timeline
              setImagePromptGenComplete(true);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error in book processing stream:", err);
        let errMsg = "An unexpected error occurred.";
        if (err instanceof Error) errMsg = err.message;
        setError(`Failed to generate comic: ${errMsg}`);
        setStatus("Error occurred");
        setIsComplete(true);
        if(storyGenInProgress) setStoryGenInProgress(false);
        if(imagePromptGenInProgress) setImagePromptGenInProgress(false);
        setStoryGenComplete(true); // Mark as complete to show error in timeline
        setImagePromptGenComplete(true);
      }
    };

    processBookStream();

  }, [userPrompt]); // Removed router dependency to prevent duplicate calls

  // Update isComplete to include save completion and redirect
  useEffect(() => {
    if (saveComplete && savedBookId) {
      // Redirect to the specific book page using the saved book ID
      setTimeout(() => {
        router.push(`/book/${savedBookId}`);
      }, 2000);
      
      setIsComplete(true);
    }
  }, [saveComplete, savedBookId, router]);

  const renderMarkdown = (content: string) => {
    return <ReactMarkdown components={{
        p: ({node, ...props}) => <p className="mb-2 text-gray-300" {...props} />,
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-3 text-yellow-400" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-2 text-yellow-500" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-semibold my-1 text-amber-500" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 text-gray-300" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 text-gray-300" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
        strong: ({node, ...props}) => <strong className="font-bold text-yellow-300" {...props} />,
        em: ({node, ...props}) => <em className="italic text-amber-300" {...props} />,
        code: ({node, ...props}) => <code className="bg-slate-800 px-1 rounded text-sm text-pink-400" {...props} />,
        pre: ({node, ...props}) => <pre className="bg-slate-800 p-2 rounded overflow-x-auto text-sm" {...props} />
    }}>{content}</ReactMarkdown>;
  };

  const TimelineItem = ({ icon: Icon, title, statusText, inProgress, isComplete, children, hasError } : {
    icon: React.ElementType, title: string, statusText?: string | React.ReactNode, 
    inProgress?: boolean, isComplete?: boolean, children?: React.ReactNode, hasError?: boolean
  }) => {
    let statusColor = "text-slate-500";
    let ringColor = "ring-slate-700";
    let bgColor = "bg-slate-800";
    let IconComponent = Icon;

    if (hasError) {
      statusColor = "text-red-500";
      ringColor = "ring-red-700";
      bgColor = "bg-red-900/30";
      IconComponent = AlertTriangleIcon;
    } else if (inProgress) {
      statusColor = "text-amber-400";
      ringColor = "ring-amber-500";
      bgColor = "bg-amber-900/30";
      IconComponent = Loader2;
    } else if (isComplete) {
      statusColor = "text-emerald-500";
      ringColor = "ring-emerald-600";
      bgColor = "bg-emerald-900/30";
      IconComponent = CheckCircle;
    }

    return (
      <div className="relative pl-12 pb-8 group">
        {/* Line Connector - not for last item */}
        <div className={`absolute left-[1.4rem] top-10 bottom-0 w-0.5 ${isComplete && !hasError ? 'bg-emerald-500' : inProgress && !hasError ? 'bg-amber-500' : hasError ? 'bg-red-500' : 'bg-slate-600'} group-last:hidden transition-colors duration-300`}></div>
        
        <div className={`absolute left-0 top-2 flex items-center justify-center w-12 h-12 rounded-full ring-4 ${ringColor} ${bgColor} z-10 transition-all duration-300 group-hover:scale-110`}>
          <IconComponent className={`w-6 h-6 ${inProgress ? 'animate-spin' : ''} ${statusColor}`} />
        </div>

        <div className="ml-4">
          <h3 className={`text-xl font-black font-sans ${statusColor} mb-1 transition-colors duration-300`}>{title}</h3>
          {statusText && <div className={`text-sm ${statusColor} italic mb-3 font-medium`}>{statusText}</div>}
          {children && (
            <div className={`p-4 mt-2 rounded-lg border shadow-xl transition-all duration-300 ${
              isComplete && !hasError ? 'bg-emerald-900/20 border-emerald-600/50' : 
              inProgress && !hasError ? 'bg-amber-900/20 border-amber-600/50' : 
              hasError ? 'bg-red-900/20 border-red-600/50' : 
              'bg-slate-800/50 border-slate-600/50'
            }`}>
              {children}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!userPrompt && !error && !isComplete) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4" style={{ backgroundImage: "url('/comic_background.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4"/>
              <p className="text-lg text-slate-300 bg-black/50 px-4 py-2 rounded-md font-bold">Loading your cosmic request...</p>
          </div>
      );
  }

  return (
    <div 
      className="min-h-screen text-slate-100 p-4 md:p-8 font-sans bg-black" 
      style={{
        backgroundImage: "url('/comic_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="max-w-4xl mx-auto bg-black/80 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-2xl border border-amber-600/20">
        <header className="mb-12 text-center transform hover:scale-105 transition-transform duration-300">
          <div className="relative z-10 my-4 md:my-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-sans text-center text-black bg-yellow-100 dark:bg-orange-100 p-3 sm:p-4 md:p-6 border-4 border-black rounded-lg shadow-2xl shadow-black/60 dark:shadow-black/80 inline-block">
              Comic Creation Engine
            </h1>
          </div>
          <div className="relative z-10 max-w-xl md:max-w-2xl mx-auto mt-4 md:mt-6">
            <p className="font-sans font-bold text-base sm:text-lg text-black dark:text-yellow-50 bg-yellow-50 dark:bg-neutral-800 p-4 sm:p-5 border-[3px] border-black dark:border-yellow-300 rounded-lg shadow-xl shadow-neutral-700/50 dark:shadow-black/60 backdrop-blur-sm">
              Processing: <span className="text-amber-600 dark:text-amber-400">{userPrompt}</span>
            </p>
          </div>
        </header>

        {/* Timeline Start */}
        <div className="space-y-0">
          <TimelineItem 
            icon={MessageSquareText} 
            title="✅ Prompt Received" 
            isComplete={true}
            statusText={`Ready to craft: "${userPrompt}"`}
          />

          <TimelineItem 
            icon={Sparkles} 
            title="📝 Generating Story" 
            inProgress={storyGenInProgress}
            isComplete={storyGenComplete}
            statusText={
              storyGenInProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status}
                </span>
              ) : storyGenComplete && !error ? "✨ Story crafted successfully!" : 
              error && storyGenComplete ? "❌ Story generation failed!" : "⏳ Preparing story generation..."
            }
            hasError={!!error && storyGenComplete && !imagePromptGenComplete}
          >
            {/* Show loading animation while generating story */}
            {storyGenInProgress && (
              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-center p-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-amber-200/30 border-t-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-amber-300 font-bold text-lg mb-2">Crafting Your STEM Adventure...</p>
                  <p className="text-amber-200 text-sm italic">Weaving an exciting educational story just for you!</p>
                </div>
              </div>
            )}

            {chapterName && (
              <div className="mb-4 p-4 bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-lg border-2 border-amber-500/50 shadow-lg">
                <h3 className="text-2xl font-black text-amber-300 mb-2 font-sans">📖 {chapterName}</h3>
                {storySummary && (
                  <p className="text-amber-200 text-sm italic font-medium leading-relaxed">{storySummary}</p>
                )}
              </div>
            )}
            
            {/* Display individual story parts */}
            {storyParts.length > 0 && (
              <div className="space-y-4">
                {storyParts.map((part, index) => (
                  <div key={`part-${part.part_number}-${index}`} className="p-4 bg-slate-800/70 rounded-lg border-2 border-sky-500/40 shadow-lg hover:border-sky-400/60 transition-colors duration-300">
                    <h4 className="text-lg font-black text-sky-300 mb-3 font-sans">
                      Part {part.part_number}: {part.chapter_title}
                    </h4>
                    <div className="text-gray-300 font-medium leading-relaxed">
                      {renderMarkdown(part.story_content)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show summary if no parts loaded yet */}
            {currentStoryChunks && storyParts.length === 0 && (
              <div ref={storyContainerRef} className="max-h-80 overflow-y-auto p-4 bg-slate-900/70 rounded-lg border-2 border-slate-500/40 scrollbar-thin scrollbar-thumb-sky-500 scrollbar-track-slate-800">
                <div className="font-medium leading-relaxed">
                  {renderMarkdown(currentStoryChunks)}
                </div>
              </div>
            )}
            
            {storyGenComplete && storySummary && !isComplete && !imagePromptGenInProgress && !imagePromptGenComplete && (
                 <div className="mt-4 p-4 bg-emerald-900/40 rounded-lg border-2 border-emerald-500/50 shadow-lg">
                    <p className="text-emerald-300 font-bold text-lg">🎉 Story Complete!</p>
                    <p className="text-emerald-200 text-sm mt-1">Now preparing visual prompts for your comic panels...</p>
                </div>
            )}
          </TimelineItem>

          <TimelineItem 
            icon={ImageIcon} 
            title="🎨 Generating Image Prompts" 
            inProgress={imagePromptGenInProgress}
            isComplete={imagePromptGenComplete}
            statusText={
                imagePromptGenInProgress ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status}
                  </span>
                ) :
                imagePromptGenComplete && !error ? "🖼️ Image prompts ready!" :
                error && imagePromptGenComplete ? "❌ Image prompt generation failed!" :
                !storyGenComplete ? "⏳ Waiting for story..." : "⏳ Preparing image prompts..."
            }
            hasError={!!error && imagePromptGenComplete}
          >
            {/* Show loading animation while generating image prompts */}
            {imagePromptGenInProgress && (
              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-center p-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-purple-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-purple-300 font-bold text-lg mb-2">Creating Visual Blueprints...</p>
                  <p className="text-purple-200 text-sm italic">Designing the perfect comic panels for your story!</p>
                </div>
              </div>
            )}

            {/* Display for individually streamed image prompts during generation phase */}
            {finalImagePrompts.length > 0 && !imagePromptGenComplete && (
                <div className="space-y-4 mt-4">
                    <p className="text-sm text-sky-300 italic font-bold">Received {finalImagePrompts.length} / 3 image prompts...</p>
                    {finalImagePrompts.map((prompt, index) => (
                        <div key={`streaming-${prompt.id}-${index}`} className="p-4 border-2 border-sky-600/50 rounded-lg bg-slate-800/60 shadow-lg hover:border-sky-500/70 transition-colors duration-300">
                            <h4 className="text-md font-black text-sky-400 mb-2 font-sans">Image {prompt.id}: {prompt.title}</h4>
                            <p className="text-xs text-slate-400 mb-3 font-medium">{prompt.panel_layout_description}</p>
                            <div className="space-y-2">
                              <p className="text-xs text-green-400 font-bold">📝 Comic Text Elements:</p>
                              {prompt.panels.map((panel, panelIndex) => (
                                <div key={panelIndex} className="pl-3 border-l-2 border-green-500/60">
                                  <p className="text-xs text-green-300 font-medium">Panel {panel.panel_number}: {panel.dialogue_caption.substring(0, 100)}...</p>
                                </div>
                              ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </TimelineItem>

          <TimelineItem 
            icon={Palette} 
            title="🎨 Generating Images" 
            inProgress={imageGenInProgress}
            isComplete={imageGenComplete}
            statusText={
                imageGenInProgress ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {imageGenStatus}
                  </span>
                ) :
                imageGenComplete ? "🖼️ All images generated successfully!" :
                !imagePromptGenComplete ? "⏳ Waiting for image prompts..." : "⏳ Preparing to generate images..."
            }
          >
            {/* Show loading animation while generating images */}
            {imageGenInProgress && (
              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-center p-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-200/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Palette className="w-6 h-6 text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-emerald-300 font-bold text-lg mb-2">Painting Your Comic Panels...</p>
                  <p className="text-emerald-200 text-sm italic">Bringing your story to life with stunning visuals!</p>
                </div>
              </div>
            )}

            {/* Show progress during image generation */}
            {imageGenInProgress && (
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 font-bold">Progress:</span>
                        <span className="text-emerald-400 font-black text-lg">{currentImageIndex} / {finalImagePrompts.length}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 border border-slate-600">
                        <div 
                            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500 shadow-lg" 
                            style={{ width: `${(currentImageIndex / finalImagePrompts.length) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-emerald-300 italic font-medium text-center">{imageGenStatus}</p>
                </div>
            )}
            
            {/* Show generated images as they complete */}
            {generatedImages.length > 0 && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-emerald-400 font-black">🎨 Generated Images ({generatedImages.length}):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {generatedImages.map((image, index) => (
                            <div key={`gen-image-${image.id}-${index}`} className="p-3 bg-slate-800/70 rounded-lg border-2 border-emerald-500/40 hover:border-emerald-400/60 transition-colors shadow-lg hover:shadow-emerald-500/20">
                                <div className="relative aspect-square mb-2 rounded overflow-hidden bg-slate-700">
                                    <img 
                                        src={`data:image/png;base64,${image.imageBase64}`}
                                        alt={image.title}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <h4 className="text-sm font-black text-emerald-400 font-sans">Image {image.id}: {image.title}</h4>
                                {image.savedFilePath && (
                                    <p className="text-xs text-slate-500 mt-1 font-medium">Saved: {image.savedFilePath}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </TimelineItem>

          <TimelineItem 
            icon={Database} 
            title="💾 Saving to Database" 
            inProgress={saveInProgress}
            isComplete={saveComplete}
            hasError={!!saveError}
            statusText={
                saveInProgress ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving your masterpiece to the database...
                  </span>
                ) :
                saveComplete ? "✅ Successfully saved to database!" :
                saveError ? `❌ Save failed: ${saveError}` :
                !imageGenComplete ? "⏳ Waiting for images..." : "⏳ Preparing to save..."
            }
          >
            {/* Show loading animation while saving */}
            {saveInProgress && (
                <div className="space-y-4 mt-3">
                    <div className="flex items-center justify-center p-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Database className="w-6 h-6 text-blue-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-300 font-bold text-lg mb-2">Archiving Your Creation...</p>
                      <p className="text-blue-200 text-sm italic">Securing your comic book in our digital library!</p>
                    </div>
                </div>
            )}
            
            {saveComplete && savedBookId && (
                <div className="mt-3 p-4 bg-emerald-900/30 border-2 border-emerald-500/50 rounded-lg shadow-lg">
                    <p className="text-emerald-400 text-lg font-black mb-1">🎉 Your book has been saved!</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Book ID: {savedBookId}</p>
                    <p className="text-sm text-emerald-300 mt-2 font-medium">You can now access your saved books from the library.</p>
                </div>
            )}
            
            {saveError && (
                <div className="mt-3 p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg shadow-lg">
                    <p className="text-red-400 text-lg font-black mb-1">❌ Failed to save book</p>
                    <p className="text-xs text-red-300 mt-1 font-medium">{saveError}</p>
                    <button 
                        onClick={saveBookToDatabase}
                        className="mt-3 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold shadow-lg hover:shadow-red-500/20"
                    >
                        🔄 Retry Save
                    </button>
                </div>
            )}
          </TimelineItem>

          {isComplete && !error && finalStory && saveComplete && (
            <TimelineItem 
              icon={CheckCircle} 
              title="🎉 Final Masterpiece: Your Complete Comic Book"
              isComplete={true}
            >
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/90 to-yellow-50/90 dark:from-slate-900/90 dark:via-purple-900/90 dark:to-slate-900/90 rounded-xl p-6 border-2 border-amber-500/50 dark:border-purple-500/50 shadow-xl">
                <DynamicBook 
                  title={userPrompt?.slice(0, 100) || "Your Generated Comic"}
                  story={finalStory}
                  images={generatedImages.map(img => ({
                    id: img.id,
                    title: img.title,
                    src: `data:image/png;base64,${img.imageBase64}`,
                    base64: img.imageBase64,
                    prompt: img.prompt
                  }))}
                  className="mb-6"
                />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  {savedBookId && (
                    <button
                      onClick={() => router.push(`/book/${savedBookId}`)}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>📖 View Full Book</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push("/library")}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-bold"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>📚 Go to Library</span>
                  </button>
                  
                  <button
                    onClick={() => router.push("/")}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-bold"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Create Another</span>
                  </button>
                </div>
              </div>
            </TimelineItem>
          )}

          {isComplete && !error && finalImagePrompts.length > 0 && generatedImages.length === 0 && (
             <TimelineItem 
                icon={AlertTriangleIcon} 
                title="⚠️ Image Generation Incomplete"
                isComplete={true}
                hasError={true}
            >
                <div className="p-4 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg shadow-lg">
                    <p className="text-yellow-400 text-lg font-black mb-2">⚠️ Image prompts were generated but images failed to create.</p>
                    <p className="text-yellow-300 text-sm font-medium">The story is complete, but comic images could not be generated. Please try again.</p>
                    <div className="mt-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors font-bold shadow-lg hover:shadow-yellow-500/20"
                        >
                            🔄 Try Again
                        </button>
                    </div>
                </div>
            </TimelineItem>
          )}

          {error && isComplete && (
            <TimelineItem 
              icon={AlertTriangleIcon} 
              title="❌ Error Encountered"
              isComplete={true}
              hasError={true}
              statusText="An error stopped the comic creation process."
            >
              <div className="p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg shadow-lg">
                <p className="text-red-400 break-words font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors font-bold shadow-lg hover:shadow-red-500/20"
                >
                  🔄 Try Again
                </button>
              </div>
            </TimelineItem>
          )}
        
        </div>
        {/* Timeline End */}
        
        {isComplete && !saveComplete && (
             <div className="mt-12 text-center">
               <div className="relative inline-block transform hover:scale-105 transition-transform duration-300">
                 <button 
                    onClick={() => router.push("/")}
                    className="px-8 py-4 text-lg font-black text-black bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-lg shadow-2xl hover:shadow-3xl border-4 border-black transform hover:-rotate-1 transition-all duration-300 focus:outline-none focus:ring-4 ring-amber-600 ring-offset-2 ring-offset-black flex items-center justify-center group"
                >
                    ✨ Create Another Masterpiece 
                    <ArrowRight className="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform duration-200"/>
                </button>
               </div>
            </div>
        )}
      </div>
    </div>
  );
} 