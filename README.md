# Mathemagica: Interactive Math Comics

Welcome to Mathemagica! This platform transforms complex math concepts into fun, engaging comic book adventures. Experience interactive storytelling with beautiful animations and page-turning effects.

## Features

- **Engaging Hero Section**: A vibrant landing page introducing "Mathemagica" and its unique approach to learning math.
- **Interactive Math Comic Book**: A 3D animated book, "Mathemagica: The Comic Chronicles," featuring 10 chapters that turn math concepts into exciting stories.
- **AI-Powered Comic Generation**: Transform any STEM topic into a 10-part comic story with detailed image prompts using Grok AI.
- **OpenAI Image Generation**: Generate comic book illustrations using OpenAI's DALL-E 3 model with automatic URL to base64 conversion.
- **Real-time Streaming**: Watch your comic stories generate in real-time with live progress tracking.
- **Comic Book Aesthetics**: Vibrant explore page with comic book styling, category badges, and interactive elements.
- **Thematic Story Section**: Content that elaborates on the philosophy behind making math fun and accessible through comics.
- **Sleek, Modern UI**: Built with Next.js, Tailwind CSS, and Framer Motion for a smooth and visually appealing experience.

## Environment Variables

Create a `.env.local` file in the root directory with the following environment variables:

```bash
# Grok API for comic story generation
GROK_API_KEY=your_grok_api_key_here

# OpenAI API for image generation
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting API Keys

1. **Grok API Key**: Get your API key from [X.AI](https://x.ai/) for story generation
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys) for image generation

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages

- `/`: Home page with the "Mathemagica" hero section and comic background.
- `/book`: The main page featuring the interactive "Mathemagica: The Comic Chronicles" book and the story section.
- `/book-progress`: Real-time comic generation page with streaming story and image prompt creation.
- `/explore`: Comic library page with comic book aesthetics and browsing interface.
- `/test-image-page`: Testing page for DALL-E 3 image generation with URL to base64 conversion (development only).

## Project Structure

```
my-app/
├── app/                 # Next.js app directory
│   ├── page.tsx         # Home page
│   ├── book/            # Interactive Math Comic Book page
│   │   └── page.tsx     # Book page
│   ├── book-progress/   # Real-time comic generation
│   │   └── page.tsx     # Comic generation progress page
│   ├── explore/         # Comic library and exploration
│   │   └── page.tsx     # Explore comics page
│   ├── test-image-page/ # Image generation testing
│   │   └── page.tsx     # Test image generation
│   └── api/             # API routes
│       ├── comic/       # Comic story generation API (Grok)
│       │   └── route.ts
│       └── test-image/  # Image generation API (OpenAI)
│           └── route.ts
├── components/          # React components
│   ├── blocks/          # Layout blocks (hero-section, story-section)
│   ├── ui/              # UI components (button, badge, book, glow, mockup)
│   │   └── book.tsx     # Interactive Book component
│   ├── internal/        # Internal components (page-shell for navbar management)
│   └── navbar.tsx       # Site navigation with comic book styling
└── lib/                 # Utility functions
    └── utils.ts         # Common utilities
```

## API Endpoints

### `/api/comic` - Comic Story Generation
- **Method**: POST
- **Body**: `{ "prompt": "Your STEM topic" }`
- **Response**: Server-Sent Events stream with story chunks and image prompts
- **Features**: Real-time streaming, 10-part story structure, detailed image prompts

### `/api/test-image` - Image Generation
- **Method**: POST  
- **Body**: `{ "prompt": "Image description", "saveToFile": true, "filename": "optional.png" }`
- **Response**: Base64 image data and optional saved file path
- **Features**: DALL-E 3 model, URL to base64 conversion, file saving, high quality

## Technologies

- Next.js 15
- React 19
- TypeScript
- Framer Motion
- TailwindCSS
- Lucide React (for icons)
- OpenAI SDK (for image generation)
- Grok API (for story generation)
- React Markdown (for story rendering)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
