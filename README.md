# VibeNovel v2

VibeNovel v2 is a premium, 100% Client-Side (SPA/PWA) digital novel writing and AI Co-Authoring workspace. It is designed to provide authors with a rich, aesthetic, and immersive creative environment backed by powerful structural tools and AI integrations.

## 🌟 Key Features

- **Story Compass & Lorebook Engine**: Define characters (with Voice DNA), world rules, mystery layers, and items within a structured, highly visual workspace.
- **Dynamic Task-Specialized Multi-Model AI Router & Auto-Pilot**: Configure separate OpenRouter Free/Paid keys and Gemini Pools. The router automatically selects optimal free models (Gemini Flash, Nemotron) for background tasks, outline generation, and co-author chats, reserving premium paid models (Claude Sonnet, Deepseek) for creative prose. Features a robust, two-way cross-provider fallback.
- **Beat-by-Beat Prose Writer**: AI-assisted prose generation with a sophisticated 4-layer Context Pruning & memory system (Static Lorebook, Dynamic State Object, RAG, and Sliding Window).
- **Bring Your Own Key (BYOK) Security**: All user AI keys (Gemini, OpenRouter Free & Paid) are strictly stored locally in the browser's persistent storage. No keys are ever sent to or logged on an external backend.
- **100% Client-Side Architecture**: Designed to be PWA-ready and seamlessly bundled via Capacitor for Android/iOS, with zero server-side rendering required. Data synchronization is handled directly from the client to Supabase.
- **Premium Themes & Visuals**: Enjoy "Malam Kreatif" (Dark) and "Jurnal Cantik" (Light) themes with dynamic, anti-flicker synchronization and smooth micro-animations powered by Framer Motion.
- **Visualization Mode**: Built-in data visualization for story pacing (Emotional Arc Heatmaps) and character relationships (Constellation Maps).

## 🛠️ Development Setup

This project is built using React 19, TypeScript, Vite, TailwindCSS (v4), and Zustand for state management.

```bash
# Install dependencies
npm install

# Start the local development server
npm run dev

# Build the production PWA bundle
npm run build

# Run type-checking & linting
npx tsc -b --noEmit && npm run lint
```

## 📜 Architecture & Contribution Guidelines

All developers and AI agents must strictly adhere to the project's foundational documents:
- `implementation_plan_v3.md`: Master Sprint Plan & Roadmap.
- `architecture.md`: Core systems and database architecture.
- `AGENTS.md`: Mandatory coding rules (e.g., `verbatimModuleSyntax: true`, BYOK policy, UI aesthetic guidelines).

> **Important**: Do not modify the database architecture or Zustand state structures without cross-reviewing and aligning with `architecture.md`.
