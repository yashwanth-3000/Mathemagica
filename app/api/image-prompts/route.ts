import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Original base schema - we will modify this dynamically
const baseImagePromptJsonSchema = {
  type: "object",
  properties: {
    image_prompts: {
      type: "array",
      description: "A list containing image prompt objects for the provided story parts.", // Updated description
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "The sequential number of the image prompt, relative to the overall story (e.g., 1 for the first part, 4 for the fourth part if processing parts 4-6)."
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
      // minItems and maxItems will be set dynamically
    }
  },
  required: ["image_prompts"]
};

const getDynamicImagePromptSystemPrompt = (schemaString: string, numParts: number) => `You are an expert comic book artist and writer. You will be given ${numParts} part(s) of a story for a STEM-focused comic book.
Your task is to generate a list of ${numParts} detailed image prompt(s), one for each provided part of the story. Each part should have its 'id' field set to its original part_number from the input story. 
VERY IMPORTANT: You MUST ONLY output a single, valid JSON object. Do not include any text or explanation before or after the JSON object.

***ABSOLUTELY MANDATORY TEXT REQUIREMENTS - NO EXCEPTIONS:***
EVERY SINGLE IMAGE MUST CONTAIN VISIBLE TEXT ELEMENTS. THIS IS NON-NEGOTIABLE.

The JSON object must conform to the following schema:

${schemaString}

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

interface StoryPart {
  part_number: number;
  chapter_title: string;
  story_content: string;
}

export async function POST(req: NextRequest) {
  try {
    // Expect storyPartsChunk (e.g., parts 1-3 or 4-6) instead of the full storyData object
    const { storyPartsChunk } = await req.json() as { storyPartsChunk: StoryPart[] };

    if (!storyPartsChunk || !Array.isArray(storyPartsChunk) || storyPartsChunk.length === 0) {
      return new Response(JSON.stringify({ error: "Story parts chunk is required and must be a non-empty array." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const numParts = storyPartsChunk.length;

    // Dynamically create the schema string for the AI
    const dynamicSchema = { 
      ...baseImagePromptJsonSchema,
      properties: {
        ...baseImagePromptJsonSchema.properties,
        image_prompts: {
          ...baseImagePromptJsonSchema.properties.image_prompts,
          minItems: numParts, // Set dynamically
          maxItems: numParts, // Set dynamically
          description: `A list containing exactly ${numParts} image prompt object(s), one for each provided story part.`
        }
      }
    };
    const schemaString = JSON.stringify(dynamicSchema, null, 2);
    const systemPrompt = getDynamicImagePromptSystemPrompt(schemaString, numParts);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: "status", message: `Connecting to Grok for image prompt generation (${numParts} parts)...` });

          const imagePromptResponse = await openai.chat.completions.create({
            model: "grok-3-fast", 
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                // Provide only the chunk of story parts to the AI
                content: `Here are ${numParts} story part(s). Please generate image prompts based on these, ensuring each prompt's 'id' matches the original 'part_number':\n\n${JSON.stringify(storyPartsChunk, null, 2)}`,
              },
            ],
            stream: false,
            response_format: { type: "json_object" }, 
          });

          sendEvent({ type: "status", message: "Parsing image prompt response..." });

          const imagePromptContent = imagePromptResponse.choices[0]?.message?.content;
          if (!imagePromptContent) {
            throw new Error("No image prompt content was generated.");
          }

          let parsedImagePrompts: any;
          try {
            parsedImagePrompts = JSON.parse(imagePromptContent);
          } catch (e) {
            console.error("Failed to parse image prompt JSON:", imagePromptContent.substring(0,500));
            throw new Error("Failed to parse image prompt JSON response: " + imagePromptContent.substring(0, 200));
          }
          
          if (!parsedImagePrompts.image_prompts || !Array.isArray(parsedImagePrompts.image_prompts) || parsedImagePrompts.image_prompts.length !== numParts) {
             throw new Error(`Image prompt response missing required fields or incorrect structure. Expected ${numParts} prompts, got ${parsedImagePrompts.image_prompts?.length}.`);
          }

          // Send the generated prompts for the current chunk
          sendEvent({ type: "image_prompts_chunk", prompts: parsedImagePrompts.image_prompts });
          sendEvent({ type: "status", message: `Image prompts for ${numParts} parts generated successfully.` });
          controller.close();
        } catch (error: any) {
          console.error("Error in image prompt generation stream:", error);
          sendEvent({ type: "error", message: error.message });
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
  } catch (error: any) {
    console.error("Error in POST /api/image-prompts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 