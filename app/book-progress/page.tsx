"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
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

function BookProgressContent() {
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
  const generateImages = useCallback(async () => {
    if (finalImagePrompts.length === 0) return;
    
    setImageGenInProgress(true);
    setImageGenStatus("Starting image generation...");
    setCurrentImageIndex(0);
    const newGeneratedImages: GeneratedImage[] = []; // Keep track of images generated in this run
    
    for (let i = 0; i < finalImagePrompts.length; i++) {
      const imagePromptDetail = finalImagePrompts[i];
      setCurrentImageIndex(i + 1);
      const statusMessage = `Generating image ${i + 1} of ${finalImagePrompts.length}: ${imagePromptDetail.title}`;
      setImageGenStatus(statusMessage);
      
      // Construct the detailed prompt string as /api/test-image expects
      const detailedPrompt = `${imagePromptDetail.panel_layout_description} ${imagePromptDetail.panels.map(p => p.description).join(' ')} ${imagePromptDetail.art_style_mood_notes}`;

      try {
        const response = await fetch("/api/test-image", { // Reverted to /api/test-image
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: detailedPrompt, // Send the constructed detailed prompt
            saveToFile: true, // Assuming this is desired, as per original /api/test-image usage
            filename: `comic-image-${imagePromptDetail.id}.png` // Construct filename
          }),
        });

        const data = await response.json(); // Process as direct JSON response

        if (!response.ok) {
          const errorMessage = data.error || `Failed to generate image ${i + 1}`;
          if (response.status === 502 || errorMessage.includes("502") || errorMessage.includes("Bad gateway")) {
            console.warn(`OpenAI service temporarily unavailable for image ${i + 1}. Using placeholder.`);
            setImageGenStatus(`⚠️ OpenAI service temporarily down - using placeholder for image ${i + 1}`);
            const placeholderImage: GeneratedImage = {
              id: imagePromptDetail.id,
              title: imagePromptDetail.title,
              imageBase64: await createPlaceholderImage(imagePromptDetail.title, i + 1),
              imageUrl: undefined,
              savedFilePath: undefined,
              prompt: detailedPrompt
            };
            newGeneratedImages.push(placeholderImage);
            setGeneratedImages(prev => [...prev, placeholderImage]);
            await new Promise(resolve => setTimeout(resolve, 800));
            continue; // Continue to next image
          }
          throw new Error(errorMessage);
        }

        if (data.imageBase64) {
          const generatedImage: GeneratedImage = {
            id: imagePromptDetail.id,
            title: imagePromptDetail.title,
            imageBase64: data.imageBase64,
            imageUrl: data.imageUrl, // If provided by /api/test-image
            savedFilePath: data.savedFilePath, // If provided by /api/test-image
            prompt: detailedPrompt
          };
          newGeneratedImages.push(generatedImage);
          setGeneratedImages(prev => [...prev, generatedImage]);
          setImageGenStatus(`✅ Image ${i + 1} generated successfully: ${imagePromptDetail.title}`);
          await new Promise(resolve => setTimeout(resolve, 800)); // Brief pause for UI
        } else {
          throw new Error(`No image data (imageBase64) returned for image ${i + 1}`);
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error generating image ${i + 1} using /api/test-image:`, error);
        setImageGenStatus(`⚠️ Error for image ${i + 1}. Creating placeholder.`);
        
        try {
          const placeholderImage: GeneratedImage = {
            id: imagePromptDetail.id,
            title: imagePromptDetail.title,
            imageBase64: await createPlaceholderImage(imagePromptDetail.title, i + 1),
            imageUrl: undefined,
            savedFilePath: undefined,
            prompt: `Placeholder for: ${imagePromptDetail.title}`
          };
          newGeneratedImages.push(placeholderImage);
          setGeneratedImages(prev => [...prev, placeholderImage]);
          setImageGenStatus(`📝 Placeholder created for image ${i + 1}: ${imagePromptDetail.title}`);
        } catch (placeholderError) {
          console.error(`Failed to create placeholder for image ${i + 1}:`, placeholderError);
          setImageGenStatus(`❌ Failed to create content for image ${i + 1}`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setImageGenInProgress(false);
    setImageGenComplete(true);
    setImageGenStatus(`🎉 Image generation process complete! Processed ${finalImagePrompts.length} images.`);
  }, [finalImagePrompts, createPlaceholderImage]);

  // Function to save the book to Supabase
  const saveBookToDatabase = useCallback(async () => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save book to database";
      console.error("Error saving book:", error);
      setSaveError(errorMessage);
    } finally {
      setSaveInProgress(false);
    }
  }, [finalStory, generatedImages, chapterName, userPrompt]);

  // Trigger image generation when image prompts are complete
  useEffect(() => {
    if (imagePromptGenComplete && finalImagePrompts.length > 0 && !imageGenInProgress && !imageGenComplete) {
      generateImages();
    }
  }, [imagePromptGenComplete, finalImagePrompts.length, imageGenInProgress, imageGenComplete, generateImages]);

  // Auto-save when generation is complete
  useEffect(() => {
    if (imageGenComplete && finalStory && generatedImages.length > 0 && !saveInProgress && !saveComplete) {
      // Auto-save after a short delay
      const saveTimer = setTimeout(() => {
        saveBookToDatabase();
      }, 2000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [imageGenComplete, finalStory, generatedImages, saveInProgress, saveComplete, saveBookToDatabase]);

  useEffect(() => {
    if (!userPrompt) {
      setStatus("No prompt provided. Redirecting to home...");
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    // Prevent duplicate processing of the same prompt if already processed or in progress
    if (hasProcessedPromptRef.current === userPrompt) {
      // If it's the same prompt and processing is ongoing or complete, don't restart.
      // This allows the component to re-render for other state changes without re-triggering the whole flow.
      return;
    }

    // Mark this prompt as being processed
    hasProcessedPromptRef.current = userPrompt;

    // Reset states for new prompt processing
    setStatus("Initializing for new prompt...");
    setError(null);
    setCurrentStoryChunks("");
    setFinalStory(null);
    setChapterName(null);
    setStorySummary(null);
    setStoryParts([]);
    setFinalImagePrompts([]);
    setGeneratedImages([]);
    setIsComplete(false);
    
    setStoryGenInProgress(false);
    setStoryGenComplete(false);
    setImagePromptGenInProgress(false);
    setImagePromptGenComplete(false);
    setImageGenInProgress(false);
    setImageGenComplete(false);
    setCurrentImageIndex(0);
    setImageGenStatus("");
    setSaveInProgress(false);
    setSaveComplete(false);
    setSaveError(null);
    setSavedBookId(null);
    
    shouldScrollToBottomRef.current = true; // Reset auto-scroll for new prompt

    processBookStream(); // Call the async function

  }, [userPrompt, router]); // Corrected dependency array

  const processBookStream = async () => {
    // State resets are now handled in the useEffect that calls this function.
    // Ensure userPrompt is still valid (it should be, due to the calling useEffect's check)
    if (!userPrompt) {
        setError("User prompt became invalid during processing initiation.");
        setStatus("Error: Prompt disappeared.");
        return;
    }

    // 1. Story Generation
    try {
      setStatus(`Connecting to story generation service for: "${userPrompt}"`);
      setStoryGenInProgress(true);

      const storyResponse = await fetch("/api/story", { // <<<< UPDATED API
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!storyResponse.ok || !storyResponse.body) {
        const errorData = await storyResponse.json().catch(() => ({ error: "Failed to parse error from /api/story" }));
        throw new Error(errorData.error || `Story API request failed with status ${storyResponse.status}`);
      }

      const reader = storyResponse.body.getReader();
      const decoder = new TextDecoder();
      let storyBuffer = "";
      const tempStoryParts: typeof storyParts = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        storyBuffer += decoder.decode(value, { stream: true });
        const eventLines = storyBuffer.split("\n\n");
        storyBuffer = eventLines.pop() || ""; // Keep incomplete event line in buffer

        for (const line of eventLines) {
          if (line.startsWith("data: ")) {
            const jsonString = line.substring(6);
            if (jsonString) {
              try {
                const eventData = JSON.parse(jsonString);
                setStatus(eventData.message || "Processing story...");
                
                if (eventData.type === "status") {
                  setCurrentStoryChunks(prev => prev + `\nStatus: ${eventData.message}`);
                } else if (eventData.type === "story_summary") {
                  setChapterName(eventData.chapter_name);
                  setStorySummary(eventData.summary);
                  setCurrentStoryChunks(prev => prev + `\n## ${eventData.chapter_name}\n\n**Summary:** ${eventData.summary}\n`);
                } else if (eventData.type === "story_part") {
                  tempStoryParts.push({ 
                    part_number: eventData.part_number, 
                    chapter_title: eventData.chapter_title, 
                    story_content: eventData.story_content 
                  });
                  setStoryParts([...tempStoryParts]); // Update for UI display as parts arrive
                  setCurrentStoryChunks(prev => prev + `\n### Part ${eventData.part_number}: ${eventData.chapter_title}\n${eventData.story_content}\n`);
                } else if (eventData.type === "error") {
                  throw new Error(`Story API Error: ${eventData.message}`);
                }
              } catch (e) {
                console.warn("Failed to parse JSON from story stream:", jsonString, e);
                setCurrentStoryChunks(prev => prev + `\n*Error parsing story data chunk.*`);
              }
            }
          }
        }
      }
      setStoryGenComplete(true);
      setStoryGenInProgress(false);
      setStatus("Story generation complete. Preparing for image prompt generation...");
      const assembledStory = tempStoryParts.map(p => `Part ${p.part_number}: ${p.chapter_title}\n${p.story_content}`).join('\n\n');
      setFinalStory(assembledStory); // Set final story from accumulated parts
      
      // 2. Image Prompt Generation (Chunked)
      setImagePromptGenInProgress(true);
      setStatus("Requesting image prompts (chunk 1 of 2)...");
      setCurrentStoryChunks(prev => prev + "\n\nRequesting image prompts (chunk 1 of 2)...");

      const allGeneratedPrompts: ParsedImagePrompt[] = [];
      const chunkSize = 3;

      for (let i = 0; i < tempStoryParts.length; i += chunkSize) {
        const chunk = tempStoryParts.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;

        const chunkNumber = Math.floor(i / chunkSize) + 1;
        const totalChunks = Math.ceil(tempStoryParts.length / chunkSize);
        
        setStatus(`Requesting image prompts (chunk ${chunkNumber} of ${totalChunks})...`);
        setCurrentStoryChunks(prev => prev + `\nStatus (Prompts): Processing chunk ${chunkNumber}/${totalChunks} for ${chunk.length} parts.`);

        const imagePromptResponse = await fetch("/api/image-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyPartsChunk: chunk }), // Send the current chunk
        });

        if (!imagePromptResponse.ok || !imagePromptResponse.body) {
          const errorData = await imagePromptResponse.json().catch(() => ({ error: `Failed to parse error from /api/image-prompts for chunk ${chunkNumber}` }));
          throw new Error(errorData.error || `Image Prompts API request failed for chunk ${chunkNumber} with status ${imagePromptResponse.status}`);
        }
        
        const imagePromptReader = imagePromptResponse.body.getReader();
        let imagePromptBuffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await imagePromptReader.read();
          if (done) break;

          imagePromptBuffer += decoder.decode(value, { stream: true });
          const eventLines = imagePromptBuffer.split("\n\n");
          imagePromptBuffer = eventLines.pop() || "";

          for (const line of eventLines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.substring(6);
              if (jsonString) {
                try {
                  const eventData = JSON.parse(jsonString);
                  if (eventData.type === "status") {
                    setStatus(eventData.message || `Processing image prompts (chunk ${chunkNumber})...`);
                    setCurrentStoryChunks(prev => prev + `\nStatus (Prompts Chunk ${chunkNumber}): ${eventData.message}`);
                  } else if (eventData.type === "image_prompts_chunk" && eventData.prompts) {
                    allGeneratedPrompts.push(...eventData.prompts);
                    setFinalImagePrompts([...allGeneratedPrompts]); // Update UI incrementally
                    setCurrentStoryChunks(prev => prev + `\n\n**Received ${eventData.prompts.length} Image Prompts from chunk ${chunkNumber}:**\n${eventData.prompts.map((p: ParsedImagePrompt) => `  - ID ${p.id}: ${p.title}`).join('\n')}`);
                  } else if (eventData.type === "error") {
                    throw new Error(`Image Prompts API Error (chunk ${chunkNumber}): ${eventData.message}`);
                  }
                } catch (e) {
                  console.warn(`Failed to parse JSON from image-prompts stream (chunk ${chunkNumber}):`, jsonString, e);
                  setCurrentStoryChunks(prev => prev + `\n*Error parsing image prompt data chunk ${chunkNumber}.*`);
                }
              }
            }
          }
        }
        setStatus(`Image prompts for chunk ${chunkNumber} of ${totalChunks} received.`);
        setCurrentStoryChunks(prev => prev + `\nStatus (Prompts): Chunk ${chunkNumber}/${totalChunks} processed.`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between chunks
      }
      
      setFinalImagePrompts([...allGeneratedPrompts]); // Ensure final state is set after loop
      setImagePromptGenComplete(true);

      // 3. Image Generation (will be triggered by useEffect on finalImagePrompts change)
      // The generateImages function will handle this part.
      // We just need to ensure finalImagePrompts is set.
      if (finalImagePrompts.length === 0 && allGeneratedPrompts.length > 0) {
           // This case should ideally not happen if image_prompts event is correctly sent
           setFinalImagePrompts([...allGeneratedPrompts]); 
      }


    } catch (e: any) {
      console.error("Error during book processing stream:", e);
      setError(e.message || "An unknown error occurred");
      setStatus(`Error: ${e.message || "Unknown error"}`);
      setStoryGenInProgress(false);
      setImagePromptGenInProgress(false);
      setImageGenInProgress(false); // Also stop image gen if preceding steps fail
    } finally {
      // Ensure progress flags are correctly set if an error occurred mid-process
      if (!storyGenComplete) setStoryGenInProgress(false);
      if (!imagePromptGenComplete) setImagePromptGenInProgress(false);
      // setIsComplete(true); // Completion is now handled after image generation
    }
  };

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
        p: ({...props}) => <p className="mb-2 text-gray-300" {...props} />,
        h1: ({...props}) => <h1 className="text-2xl font-bold my-3 text-yellow-400" {...props} />,
        h2: ({...props}) => <h2 className="text-xl font-semibold my-2 text-yellow-500" {...props} />,
        h3: ({...props}) => <h3 className="text-lg font-semibold my-1 text-amber-500" {...props} />,
        ul: ({...props}) => <ul className="list-disc pl-5 mb-2 text-gray-300" {...props} />,
        ol: ({...props}) => <ol className="list-decimal pl-5 mb-2 text-gray-300" {...props} />,
        li: ({...props}) => <li className="mb-1" {...props} />,
        strong: ({...props}) => <strong className="font-bold text-yellow-300" {...props} />,
        em: ({...props}) => <em className="italic text-amber-300" {...props} />,
        code: ({...props}) => <code className="bg-slate-800 px-1 rounded text-sm text-pink-400" {...props} />,
        pre: ({...props}) => <pre className="bg-slate-800 p-2 rounded overflow-x-auto text-sm" {...props} />
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
                    <p className="text-sm text-sky-300 italic font-bold">Received {finalImagePrompts.length} / 6 image prompts...</p>
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
                                    <Image 
                                        src={`data:image/png;base64,${image.imageBase64}`}
                                        alt={image.title}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        width={256}
                                        height={256}
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

export default function BookProgress() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4" style={{ backgroundImage: "url('/comic_background.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4"/>
        <p className="text-lg text-slate-300 bg-black/50 px-4 py-2 rounded-md font-bold">Loading your cosmic request...</p>
      </div>
    }>
      <BookProgressContent />
    </Suspense>
  );
} 