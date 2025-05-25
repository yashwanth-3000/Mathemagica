import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const storySystemPrompt = `You are Comic GPT, a storytelling engine that transforms any STEM concept into an exciting, easy-to-follow, 6-part comic-book-style adventure. You will generate stories in a structured JSON format that includes both chapter information and detailed story content.

For each STEM topic provided, you must output a JSON response with this exact structure:

{
  "overall_chapter_name": "A catchy title for the entire comic adventure",
  "story_summary": "A brief 3-4 line summary of the entire adventure story that captures the essence without giving away all details",
  "parts": [
    {
      "part_number": 1,
      "chapter_title": "Title for Part 1",
      "story_content": "Detailed story content for Part 1 with comic book elements, onomatopoeia, and STEM explanations"
    },
    {
      "part_number": 2, 
      "chapter_title": "Title for Part 2",
      "story_content": "Detailed story content for Part 2 continuing the adventure and building understanding"
    },
    {
      "part_number": 3,
      "chapter_title": "Title for Part 3", 
      "story_content": "Detailed story content for Part 3 advancing the story and deepening knowledge"
    },
    {
      "part_number": 4,
      "chapter_title": "Title for Part 4", 
      "story_content": "Detailed story content for Part 4 escalating the adventure and exploring concepts further"
    },
    {
      "part_number": 5,
      "chapter_title": "Title for Part 5", 
      "story_content": "Detailed story content for Part 5 building toward the climax and reinforcing learning"
    },
    {
      "part_number": 6,
      "chapter_title": "Title for Part 6", 
      "story_content": "Detailed story content for Part 6 providing complete resolution and final understanding"
    }
  ]
}

Rules for story creation:
- Each part should have 4-6 sentences with comic book flair
- Include onomatopoeia (BAM!, WHOOSH!, etc.) and vivid action verbs
- Create characters that personify STEM concepts (e.g., "Captain Circuit" for electricity)
- Build understanding step by step, linking back to previous parts
- Embed clear definitions, analogies, or examples that teach core principles
- End Parts 1-5 with cliffhangers or transitions, Part 6 with complete resolution
- Keep tone fun and accessible - explain technical terms in action
- The story_summary should be exactly 3-4 lines
- Each chapter_title should hint at the adventure in that section
- Develop the story arc across all 6 parts with proper pacing and character development

IMPORTANT: You MUST output valid JSON only. No additional text before or after the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt: userPrompt } = await req.json();

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: "status", message: "Connecting to Grok for story generation..." });

          // Generate story with JSON format using grok-3-fast
          const storyResponse = await openai.chat.completions.create({
            model: "grok-3-fast",
            messages: [
              { role: "system", content: storySystemPrompt },
              { role: "user", content: `STEM Topic: ${userPrompt}` },
            ],
            stream: false,
            response_format: { type: "json_object" },
          });

          sendEvent({ type: "status", message: "Parsing story response..." });
          
          const storyContent = storyResponse.choices[0]?.message?.content;
          if (!storyContent) {
            throw new Error("No story content was generated.");
          }

          // Parse the JSON response
          let parsedStoryData: {
            overall_chapter_name: string;
            story_summary: string;
            parts: Array<{
              part_number: number;
              chapter_title: string;
              story_content: string;
            }>;
          };
          try {
            parsedStoryData = JSON.parse(storyContent);
          } catch {
            console.error("Failed to parse story JSON:", storyContent.substring(0,500));
            throw new Error("Failed to parse story JSON response: " + storyContent.substring(0, 200));
          }

          // Validate the story structure
          if (!parsedStoryData.overall_chapter_name || !parsedStoryData.story_summary || !parsedStoryData.parts) {
            throw new Error("Story response missing required fields.");
          }

          sendEvent({ type: "status", message: "Story generated successfully!" });

          // Send the overall chapter name and summary for display
          sendEvent({ 
            type: "story_summary", 
            chapter_name: parsedStoryData.overall_chapter_name,
            summary: parsedStoryData.story_summary 
          });

          // Send each part individually with its own chapter name and content
          sendEvent({ type: "status", message: "Displaying story parts..." });
          for (const part of parsedStoryData.parts) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between parts
            
            sendEvent({ 
              type: "story_part", 
              part_number: part.part_number,
              chapter_title: part.chapter_title,
              story_content: part.story_content
            });
          }
          sendEvent({ type: "status", message: "Story generation complete." });
          controller.close();
        } catch (error: unknown) {
          console.error("Error in story generation stream:", error);
          sendEvent({ type: "error", message: (error instanceof Error) ? error.message : String(error) });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/story:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error) ? error.message : String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 