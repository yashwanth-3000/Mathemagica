"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function TestImagePage() {
  const [prompt, setPrompt] = useState<string>("A futuristic cityscape at sunset, cyberpunk style");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }

    setIsLoading(true);
    setImageBase64(null);
    setImageUrl(null);
    setSavedFilePath(null);
    setError(null);

    try {
      const response = await fetch("/api/test-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          saveToFile: true, // Request to save the file
          filename: `openai-${Date.now()}.png`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API request failed with status ${response.status}`);
      }

      if (data.imageBase64) {
        setImageBase64(data.imageBase64);
        setImageUrl(data.imageUrl);
        setSavedFilePath(data.savedFilePath);
      } else {
        throw new Error("No image data returned from API.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image. Check console for details.';
      console.error("Error calling OpenAI image API:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-500 py-2">
            OpenAI Image Test
          </h1>
          <p className="text-slate-400 mt-2">Test OpenAI&apos;s image models (gpt-image-1 / DALL-E 3) with automatic format handling.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-sky-300 mb-1">
              Image Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-slate-100 text-sm"
              placeholder="Enter your image prompt here..."
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-600 rounded-md shadow-lg hover:from-sky-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              "Generate Image"
            )}
          </button>
        </form>

        {error && (
          <div className="my-6 p-4 bg-red-800/30 border border-red-700 rounded-md text-red-300 text-sm">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {imageBase64 && (
          <div className="mt-8 p-4 border-2 border-sky-500/60 rounded-xl bg-slate-800/80 shadow-2xl">
            <h2 className="text-2xl font-semibold text-sky-400 mb-4 text-center">Generated Image:</h2>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-700 mb-4">
              <Image 
                src={`data:image/png;base64,${imageBase64}`}
                alt="Generated by OpenAI" 
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            
            {/* Show both saved file and original URL */}
            <div className="space-y-3 text-center">
              {savedFilePath && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Saved to:</p>
                  <a 
                    href={savedFilePath} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-400 hover:text-sky-300 underline text-sm break-all"
                  >
                    {savedFilePath}
                  </a>
                </div>
              )}
              
              {imageUrl && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Original URL:</p>
                  <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-green-400 hover:text-green-300 underline text-xs break-all"
                  >
                    {imageUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 