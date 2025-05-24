import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Use OpenAI's official API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, saveToFile = false, filename } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set.");
      return NextResponse.json({ error: "OpenAI API key not configured on server." }, { status: 500 });
    }
    
    console.log(`[OpenAI Image API] Received prompt: "${prompt}"`);

    // Generate image with gpt-image-1
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1536",
      quality: "medium",
    });

    if (!result.data || result.data.length === 0) {
      console.error("[OpenAI Image API] No data found in image response:", result);
      return NextResponse.json({ error: "Failed to generate image or no data returned" }, { status: 500 });
    }

    let image_base64: string;
    let imageUrl: string | null = null;

    // Handle different response formats based on model
    const responseData = result.data[0];
    
    if (responseData.b64_json) {
      // gpt-image-1 returns base64 directly
      image_base64 = responseData.b64_json;
      console.log(`[OpenAI Image API] Got base64 data directly from gpt-image-1`);
    } else if (responseData.url) {
      // dall-e-3 returns URL, need to fetch and convert
      imageUrl = responseData.url;
      console.log(`[OpenAI Image API] Got URL from DALL-E 3: ${imageUrl}`);
      
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      image_base64 = Buffer.from(imageBuffer).toString('base64');
      console.log(`[OpenAI Image API] Converted URL image to base64`);
    } else {
      console.error("[OpenAI Image API] No base64 or URL found in response:", responseData);
      return NextResponse.json({ error: "Failed to generate image - no base64 or URL returned" }, { status: 500 });
    }

    console.log(`[OpenAI Image API] Image processing completed successfully`);

    // Optional: Save to file if requested
    let savedFilePath = null;
    if (saveToFile) {
      try {
        // Create public/generated-images directory if it doesn't exist
        const outputDir = path.join(process.cwd(), 'public', 'generated-images');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate filename with timestamp if none provided
        const fileName = filename || `generated-${Date.now()}.png`;
        const filePath = path.join(outputDir, fileName);
        
        // Save the image to a file
        const image_bytes = Buffer.from(image_base64, "base64");
        fs.writeFileSync(filePath, new Uint8Array(image_bytes));
        
        savedFilePath = `/generated-images/${fileName}`;
        console.log(`[OpenAI Image API] Image saved to: ${filePath}`);
      } catch (saveError) {
        console.error("[OpenAI Image API] Error saving file:", saveError);
        // Don't fail the request if file saving fails
      }
    }

    return NextResponse.json({ 
      imageBase64: image_base64,
      imageUrl: imageUrl, // Will be null for gpt-image-1, URL for dall-e-3
      savedFilePath,
      prompt: prompt 
    });

  } catch (error: unknown) {
    console.error("[OpenAI Image API] Error generating image:", error);
    let errorMessage = "An unknown error occurred while generating the image.";
    let statusCode = 500;

    // Handle OpenAI-specific errors
    if (error && typeof error === 'object' && error !== null) {
      if ('status' in error && typeof error.status === 'number') {
        statusCode = error.status;
      }
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'object' && error.error !== null && 'message' in error.error && typeof error.error.message === 'string') {
        errorMessage = error.error.message;
      } else if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        const errorData = error.response.data as Record<string, unknown>;
        const errorObj = errorData.error as Record<string, unknown> | undefined;
        errorMessage = (errorObj?.message as string) || (errorData.error as string) || (errorData.message as string) || errorMessage;
        if ('status' in error.response && typeof error.response.status === 'number') statusCode = error.response.status;
      }
    }
    
    return NextResponse.json({ error: errorMessage, details: error }, { status: statusCode });
  }
} 