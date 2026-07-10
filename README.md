# AtlasAI — Interactive Trip Planner & AI Feature Showcase

**Author:** Shreedhar K B  
*Built for the Frontend Internship Assignment*

🚀 **Live Demo:** [https://atalsai.vercel.app/](https://atalsai.vercel.app/)

---

## Overview

**AtlasAI** is a modern, responsive, and resilient AI-powered web application built using **React**, **Next.js (App Router)**, and the **Groq API (`llama-3.3-70b-versatile`)**. 

Rather than acting as a standard text-based chatbot, AtlasAI transforms unpredictable, free-form natural language prompts into **structured, interactive, and stateful UI components**. Users can plan complex itineraries day by day, drag-and-drop stops to reorder their schedule, check off packing items, inspect interactive budget charts, and refine their trip plans through follow-up prompts without losing context.

---

## Key Features & Architecture

### 1. Interactive & Stateful UI (`Frontend Architecture`)
- **Per-Day Drag-and-Drop Reordering:** Powered by `@dnd-kit`, users can independently reorder stops within any day of their itinerary.
- **Dynamic Block Components:** Automatically renders specialized interactive UI blocks based on AI output:
  - **Estimated Budget Chart:** Interactive breakdown of costs (Accommodation, Dining, Activities, Transport) with visual progress bars.
  - **Packing Checklist:** Interactive checkable/uncheckable list (`isChecked` state) preserved across renders.
  - **Local Travel Tips:** Numbered advice cards tailored to the specific destination.
- **Expandable & Removable Stops:** Click any stop card to expand detailed timing, duration, descriptions, practical tips, and category magnet badges. Click the `X` icon to instantly remove unwanted stops from the day's schedule.
- **Trip Refinement Loop:** A dedicated follow-up bar lets users edit the existing itinerary (e.g., *"Make Day 2 more budget-friendly and add a coffee shop inside Day 1"*) while preserving supplementary interactive blocks.
- **Saved Trip Sessions (`LocalStorage` Archive):** Past itineraries and prompts are automatically stored in the browser. Click the **"Previous Trips"** button in the header to open a sliding drawer and restore previous itineraries anytime.

### 2. Bulletproof Error Handling & Resilience (`Handling Bad AI Output`)
Handling failure well is the core engineering highlight of this application:
- **Multi-Layer JSON & Truncation Parser (`parseItinerary.js`):** Extracts valid JSON even if the model wraps it in markdown (` ```json `), inserts trailing commas, or truncates output mid-stream. Includes an intelligent auto-repair stack (`attemptRepairTruncatedJSON`) that iteratively salvages valid prefixes.
- **Shape & Type Normalization:** Auto-normalizes unexpected response shapes, fuzzy-matches custom categories into valid themes, and gracefully provides fallback strings for missing keys.
- **Race Condition & Stale Response Prevention:** Implements request-ID tracking (`currentRequestId.current`) combined with `AbortController`. If a user rapidly submits multiple prompts or hits back/reset while a request is in flight, the old request is cancelled/ignored so stale data never overwrites newer responses.
- **Timeout Protection & Standalone Retry UI:** A 45-second abort timer catches hanging or slow server responses and routes the user to a standalone, glassmorphic Error UI equipped with a one-click **"Try Again"** retry loop.

### 3. Premium Aesthetics & Polish
- **Dynamic Animations:** Fluid Framer Motion `layoutId` transitions between collapsed cards and expanded modal hero layouts.
- **Modern Visual Tokens:** Terminal typing initialization checkpoints, `LetterGlitch` background effects, `BorderBeam` card accents, `SpotlightCard` highlights, and `MetallicPaint` headers.
- **Keyboard Navigation:** Support for `Ctrl + Enter` / `Cmd + Enter` quick submission and accessible keyboard drag-and-drop sensors.

---

## Setup Instructions

### 1. Prerequisites & Installation
Clone the repository and install dependencies:
```bash
git clone <repository_url>
cd trip-planner
npm install
```

### 2. API Key Configuration
Create a `.env.local` file in the root directory of the project and add your Groq API key (free tier keys can be generated at [console.groq.com](https://console.groq.com)):
```env
GROQ_API_KEY=your_groq_api_key_here
```
> **Security Note:** The API key is securely accessed server-side within Next.js API route handlers (`/api/stream-itinerary` & `/api/refine-itinerary`) and is **never exposed to the client browser**.

### 3. Running the Application Locally
You can run the application in either production mode or development mode:

#### Production Mode (Recommended for testing assignment evaluation standards):
```bash
npm install && npm start
```
*(Note: A custom `"prestart": "next build"` hook is configured in `package.json` so running `npm start` automatically compiles the production build before starting the server cleanly on port 3000.)*

#### Development Mode (With live hot reloading):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to begin planning trips!

---

## Usage Guide

1. **Describe Your Trip:** On the home screen, type any free-form travel idea (e.g., *"A 4-day culinary and cultural tour of Tokyo for two"*), or click one of the quick-select example pills. Press `Enter` (or `Ctrl+Enter`) / click **Generate**.
2. **Watch Live Generation:** The terminal UI will show live server initialization, and the itinerary will stream directly into interactive cards.
3. **Interact With Your Itinerary:**
   - **Reorder:** Grab the drag handle on any stop card and reorder stops within that day.
   - **Expand/Remove:** Click a card to read full practical tips and category badges, or click `X` to remove a stop.
   - **Checklists & Budgets:** Scroll down to view the Estimated Budget progress bars and check off items in your Packing Checklist.
4. **Refine Your Trip:** Use the bottom input bar to ask follow-up edits without starting from scratch.
5. **Manage Past Trips:** Click the **Previous Trips** button in the top right to slide open the archive drawer and reload past itineraries.

---

## AI Usage Note

Being transparent about AI tooling: I actively utilized AI coding assistants (specifically an agent-based environment running LLMs) to rapidly prototype UI components, implement the `@dnd-kit` vertical list sorting algorithms, and generate complex Tailwind/Three.js visual animations (`LetterGlitch`, `MetallicPaint`, `SpotlightCard`). 

I directly guided and instructed the AI on the architectural pattern, specifically designing and verifying:
- The multi-layer auto-repair JSON parser (`lib/parseItinerary.js`).
- The race condition prevention and `AbortController` state machine (`hooks/useItinerary.js`).
- The Next.js server-side streaming and refinement endpoints (`app/api/stream-itinerary/route.js`).
I fully understand, have tested, and can explain every line of code across the backend and frontend architecture.

---

## Known Limitations

- **Large Context Prompts:** If the user requests an extraordinarily long itinerary (e.g., a 30-day trip with 10 stops per day), the LLM's response length may exceed max token output thresholds or take longer to generate. However, the multi-layer parser is built to auto-repair and salvage partial data even if cut off.
- **External Image API:** Destination thumbnail images are loaded dynamically via `pollinations.ai` prompts. If their external service experiences high load, placeholder fallbacks are rendered.

---

## Time Spent

- **Total Time:** ~6 hours
  - **UI/UX, Animations & Components:** ~2 hours (building responsive day sections, stop cards, block cards, and visual effects).
  - **Backend API Routing & Structured Prompting:** ~1 hour (setting up strict JSON schema prompting, streaming responses, and server-side route handlers).
  - **Error Handling, Parsing & State Machine:** ~1.5 hours (building `parseItinerary.js` auto-repair logic, race condition tracking, timeouts, and `useItinerary` custom hook).
  - **Refactoring & Polish:** ~1.5 hours (wiring drag-and-drop mechanics, LocalStorage session caching, keyboard navigation, and production checks).
