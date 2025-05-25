import { NextResponse } from "next/server";

export async function POST() {
  // This route is being refactored. 
  // Story generation is now at /api/story
  // Image prompt generation is now at /api/image-prompts
  // Comic photo generation will be at /api/comic-photos

  // You might want to update your frontend to call these new specific routes.
  // Or, this route could be updated to orchestrate calls to the new routes.

  return NextResponse.json(
    {
      message:
        "This API endpoint has been refactored. Please use the new specific endpoints: /api/story, /api/image-prompts, and /api/comic-photos.",
    },
    { status: 404 } // Or a more appropriate status code like 301 Moved Permanently if you set up redirects.
  );
}

// Keeping the OpenAI client and system prompts here for now, 
// as they might be used if this route becomes an orchestrator.
// However, they are duplicated in the new routes and should ideally be centralized or removed from here if not used.

/*
import OpenAI from "openai";

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

const imagePromptJsonSchema = {
  type: "object",
  properties: {
    image_prompts: {
      type: "array",
      description: "A list containing exactly six image prompt objects.",
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
      minItems: 6,
      maxItems: 6
    }
  },
  required: ["image_prompts"]
};

const imagePromptSystemPrompt = `You are an expert comic book artist and writer. You will be given a 6-part story for a STEM-focused comic book.
Your task is to generate a list of 6 detailed image prompts, one for each part of the story. 
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
*/