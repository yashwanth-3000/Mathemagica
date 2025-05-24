import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const storySystemPrompt = `You are Comic GPT, a storytelling engine that transforms any STEM concept into an exciting, easy-to-follow, 3-part comic-book-style adventure. You will generate stories in a structured JSON format that includes both chapter information and detailed story content.

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
      "story_content": "Detailed story content for Part 3 providing resolution and completing the learning"
    }
  ]
}

Rules for story creation:
- Each part should have 4-6 sentences with comic book flair
- Include onomatopoeia (BAM!, WHOOSH!, etc.) and vivid action verbs
- Create characters that personify STEM concepts (e.g., "Captain Circuit" for electricity)
- Build understanding step by step, linking back to previous parts
- Embed clear definitions, analogies, or examples that teach core principles
- End Parts 1 & 2 with cliffhangers, Part 3 with resolution
- Keep tone fun and accessible - explain technical terms in action
- The story_summary should be exactly 3-4 lines
- Each chapter_title should hint at the adventure in that section

IMPORTANT: You MUST output valid JSON only. No additional text before or after the JSON object.`;

const imagePromptJsonSchema = {
  type: "object",
  properties: {
    image_prompts: {
      type: "array",
      description: "A list containing exactly three image prompt objects.",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "The sequential number of the image prompt, e.g., 1 for the first prompt."
          },
          title: {
            type: "string",
            description: "A short, descriptive title for this specific image prompt/comic part. This title should be based on the content of the comic panel, e.g., 'The Rise of ThinkBot City'."
          },
          panel_layout_description: {
            type: "string",
            description: "Overall description of the panel layout (e.g., 'Three equal vertical panels with crisp 3px black borders and 8px white gutters')."
          },
          panels: {
            type: "array",
            description: "An array of exactly three objects, where each object describes a single panel.",
            items: {
              type: "object",
              properties: {
                panel_number: {
                  type: "integer",
                  description: "The number of the panel (1, 2, or 3)."
                },
                description: {
                  type: "string",
                  description: "Detailed visual description for this panel: Who (characters or objects), Where (setting, background details), What (primary action or emotion), and Camera angle (e.g., low-angle close-up)."
                },
                dialogue_caption: {
                  type: "string",
                  description: "MANDATORY TEXT ELEMENTS FOR THIS PANEL - MUST INCLUDE ALL OF THE FOLLOWING: 1) Large speech bubble with character dialogue in ALL CAPS (e.g. 'Speech bubble top-left: \"I'LL STOP THIS DATA STORM!\"'), 2) Prominent sound effect text overlaying the action (e.g. 'Large sound effect center: \"CRACKLE!\" in bold red letters'), 3) Caption box with narrative text (e.g. 'Caption box bottom: \"In Cyberopolis, AI heroes defend digital reality\" in yellow box'), 4) Educational content in thought bubbles or info boxes (e.g. 'Thought bubble: \"AI learns from patterns like humans!\"'). SPECIFY EXACT TEXT CONTENT, SIZE, COLOR, AND POSITION FOR EACH ELEMENT. Text must be large, readable, and integral to the image composition."
                }
              },
              required: ["panel_number", "description", "dialogue_caption"]
            },
            minItems: 3,
            maxItems: 3
          },
          art_style_mood_notes: {
            type: "string",
            description: "Overall notes on character appearance (costume colors, textures, facial expression), mood conveyance (posture, lighting), and specific classic comic-book art style elements (e.g., bold line-weight, halftone dots, screentone patterns, speed lines, impact bursts, motion blurs, energy auras, dramatic panel bleed if needed)."
          }
        },
        required: ["id", "title", "panel_layout_description", "panels", "art_style_mood_notes"]
      },
      minItems: 3,
      maxItems: 3
    }
  },
  required: ["image_prompts"]
};

const imagePromptSystemPrompt = `You are an expert comic book artist and writer. You will be given a 3-part story for a STEM-focused comic book.
Your task is to generate a list of 3 detailed image prompts, one for each part of the story. 
VERY IMPORTANT: You MUST ONLY output a single, valid JSON object. Do not include any text or explanation before or after the JSON object.

***ABSOLUTELY MANDATORY TEXT REQUIREMENTS - NO EXCEPTIONS:***
EVERY SINGLE IMAGE MUST CONTAIN VISIBLE TEXT ELEMENTS. THIS IS NON-NEGOTIABLE.

The JSON object must conform to the following schema:

${JSON.stringify(imagePromptJsonSchema, null, 2)}

🔥 CRITICAL TEXT INTEGRATION REQUIREMENTS (MANDATORY - NOT OPTIONAL):
- EVERY panel MUST contain at least 3 types of text: speech bubbles, sound effects, and caption boxes
- SPEECH BUBBLES: Must include actual character dialogue from the story in ALL CAPS with black borders and white backgrounds
- SOUND EFFECTS: Must include large, bold onomatopoeia (BAM!, WHOOSH!, CRACKLE!, BZZT!) as prominent visual elements
- CAPTION BOXES: Must include narrative text from the story in yellow/golden rectangular boxes
- TEXT SIZE: All text must be LARGE and CLEARLY READABLE - at least 12-point equivalent size
- TEXT PLACEMENT: Text must be strategically placed without obscuring character faces
- HAND-LETTERED STYLE: Use classic comic book lettering style, bold and clear

🎨 MANDATORY TEXT STYLING REQUIREMENTS:
- Speech bubbles: White/cream background, thick black outline, tail pointing to speaker
- Sound effects: Colorful, stylized, integrated into action scenes, often following action lines
- Caption boxes: Yellow or light colored rectangular backgrounds with black text
- Thought bubbles: Cloud-like shapes for internal monologue or explanations
- Educational content: Must appear in info boxes or special bubble shapes

📍 MANDATORY TEXT PLACEMENT RULES:
- Every panel must have text in multiple locations (top, middle, bottom)
- Character dialogue MUST appear in speech bubbles near speaking characters
- Action sounds MUST appear as large overlays near the action
- Story narration MUST appear in caption boxes (usually top or bottom of panel)
- Educational explanations MUST appear in thought bubbles or special info boxes

🚀 STORY TEXT INTEGRATION REQUIREMENTS:
- Extract EXACT dialogue quotes from the provided story and place them in speech bubbles
- Convert story action descriptions into visible sound effects (CRACKLE!, WHIRR!, BZZT!)
- Include educational STEM content as readable text in thought bubbles or info boxes
- Ensure each panel's text advances both the narrative AND educational content

⚡ IMAGE GENERATION PROMPT STRUCTURE:
Each panel description must explicitly state:
1. "Include large speech bubble with text: '[EXACT DIALOGUE IN ALL CAPS]'"
2. "Add prominent sound effect text: '[SOUND EFFECT]' in bold, colorful letters"
3. "Place caption box with text: '[NARRATIVE TEXT]' in yellow background"
4. Specify exact text placement and styling for each element

FAILURE TO INCLUDE VISIBLE TEXT ELEMENTS IN EVERY PANEL IS UNACCEPTABLE.
The generated images will be rejected if they do not contain clear, readable text elements.

Double-check your output to ensure every single panel description explicitly mentions multiple text elements with exact content and placement instructions.`;

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

          // Generate story with JSON format using grok-3
          const storyResponse = await openai.chat.completions.create({
            model: "grok-3",
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

          // Create full story from parts for image generation
          const fullStory = parsedStoryData.parts.map((part: { part_number: number; chapter_title: string; story_content: string }) => 
            `Part ${part.part_number}: ${part.chapter_title}\n${part.story_content}`
          ).join('\n\n');

          sendEvent({ type: "status", message: "Story generation complete. Preparing for image prompt generation..." });
          
          sendEvent({ type: "status", message: "Generating image prompts as JSON (this may take a moment)..." });
          const imagePromptResponse = await openai.chat.completions.create({
            model: "grok-3",
            messages: [
              { role: "system", content: imagePromptSystemPrompt },
              { role: "user", content: fullStory },
            ],
            stream: false,
            response_format: { type: "json_object" },
          });

          const rawImagePromptJson = imagePromptResponse.choices[0]?.message?.content;
          if (!rawImagePromptJson) {
            throw new Error("No image prompt JSON was returned from the AI.");
          }

          sendEvent({ type: "status", message: "Parsing image prompts..." });
          let parsedImagePrompts: {
            image_prompts: Array<Record<string, unknown>>;
          };
          try {
            parsedImagePrompts = JSON.parse(rawImagePromptJson);
          } catch (e) {
            console.error("Failed to parse image prompt JSON:", e, "Raw JSON string:", rawImagePromptJson);
            throw new Error(`AI returned invalid JSON for image prompts. Raw output: ${rawImagePromptJson.substring(0,500)}...`);
          }

          // Validate the structure based on our schema (basic check)
          if (!parsedImagePrompts || !Array.isArray(parsedImagePrompts.image_prompts)) {
            console.error("Parsed image prompts JSON does not match expected structure:", parsedImagePrompts);
            throw new Error("The AI's JSON output for image prompts did not match the expected structure.");
          }

          sendEvent({ type: "status", message: "Image prompts parsed. Streaming individual prompts..." });

          // Stream each image prompt individually
          for (const imagePrompt of parsedImagePrompts.image_prompts) {
            sendEvent({ type: "image_prompt_item", item: imagePrompt });
            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between items for effect
          }

          sendEvent({ 
            type: "done", 
            story: fullStory,
            chapterName: parsedStoryData.overall_chapter_name,
            storySummary: parsedStoryData.story_summary,
            message: "All processing complete."
          });

        } catch (error: unknown) {
          console.error("[API Route Error] Error during comic generation stream:", error);
          let errorMessage = "An unknown error occurred during generation.";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          try {
            sendEvent({ type: "error", error: errorMessage });
          } catch (e) {
            console.error("[API Route Error] Failed to send error event to client:", e);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error("[API Route Error - Outer] Error in POST /api/comic:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred on the server.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}