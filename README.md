# AtlasAI — Interactive & Stateful AI Trip Planner

**Author:** Shreedhar K B  
**Assignment:** Frontend Engineering Internship Assessment  
**Live Demo:** [https://atalsai.vercel.app/](https://atalsai.vercel.app/)

---

## Executive Summary & Overview

**AtlasAI** transforms open-ended, natural language travel prompts into **structured, interactive, and stateful UI components**. Rather than acting as a traditional text-based chatbot, AtlasAI parses user requests into concrete JSON schemas and renders dynamic daily schedules, interactive cost breakdown charts, checkable packing lists, and drag-and-drop itinerary planners using **React**, **Next.js (App Router)**, and the **Groq API (`llama-3.3-70b-versatile`)**.

---

## Evaluation Standards & Feature Verification

| Evaluation Metric | Status | Implementation Details & Architecture |
| :--- | :---: | :--- |
| **Structured Output from Free-Form Prompts** | **CORE** | Converts messy, open-ended prompts (e.g., *"4-day food tour in Tokyo for two"*) into strict, type-checked JSON schemas (`itinerary.days`, `itinerary.blocks`) via server-side API routes. |
| **Stateful Interactive UI Components** | **CORE** | Every data point is rendered as a functional component:<br>• **Per-Day Drag & Drop (`@dnd-kit`)**: Reorder stops independently within any day.<br>• **Interactive Card Management**: Click any card to inspect full timing/duration/tips, or click the `X` icon to remove unwanted stops instantly. |
| **Dynamic Block Types** | **STRETCH** | Automatically renders specialized supplementary UI blocks alongside daily itineraries (`components/block-card.jsx`):<br>• **Budget Chart**: Interactive cost distribution (`Accommodation`, `Dining`, `Activities`) with visual progress bars.<br>• **Packing Checklist**: Interactive checkable items (`isChecked` preserved in state).<br>• **Travel Tips**: Editorial, numbered advice guides. |
| **Real-Time Streaming** | **STRETCH** | Implements server-side `ReadableStream` (`app/api/stream-itinerary/route.js`). Users see live terminal initialization and character-by-character generation directly in the UI. |
| **Trip Refinement Loop** | **STRETCH** | Follow-up input bar (`Refine Itinerary`) allows iterative edits (e.g., *"Make Day 2 cheaper and add a museum"*) without resetting or losing existing components (`app/api/refine-itinerary/route.js`). |
| **Save & Reload Sessions** | **STRETCH** | Past trips are automatically archived to `localStorage`. Includes a sliding **Previous Trips** drawer (`SessionDrawer`) plus **JSON Export & Import** file capabilities. |
| **UI Polish & Accessibility** | **STRETCH** | Features luxury dark mode aesthetics, Framer Motion `layoutId` modal expansions, and full **keyboard navigation** (`Ctrl+Enter` submission, `Escape` key modal closing, accessible drag-and-drop sensors). |

---

## Engineering Highlight: Handling Bad AI Output & Resilience

Handling LLM failure modes gracefully is the architectural highlight of this project:

1. **Multi-Layer Truncated JSON Auto-Repair (`lib/parseItinerary.js`)**
   - If the AI truncates output mid-stream due to token limits or wraps JSON in markdown (` ```json `), an intelligent auto-repair stack (`attemptRepairTruncatedJSON`) iteratively closes open brackets and salvages valid data up to the truncation point.
2. **Race Condition & Stale Response Prevention (`hooks/useItinerary.js`)**
   - Implements request-ID tracking (`currentRequestId.current`) combined with `AbortController`. Rapid successive submissions or back-button clicks automatically cancel older in-flight network requests so stale data never overwrites new results.
3. **Timeout Protection & Standalone Retry UI**
   - A 45-second abort timer catches hanging server responses and routes the user to a standalone, glassmorphic Error UI equipped with a one-click **"Try Again"** retry loop.

---

## Setup Instructions

### Prerequisites
Ensure you have Node.js (`v18+`) and npm installed.

```bash
# Clone the repository and navigate to the root directory
git clone <repository_url>
cd trip-planner
npm install
```

### API Configuration
Create a `.env.local` file in the root directory of the project and add your Groq API key (free tier keys can be generated instantly at [console.groq.com](https://console.groq.com)):
```env
GROQ_API_KEY=your_groq_api_key_here
```
> **Security Note:** API keys are accessed strictly server-side within Next.js API route handlers (`/api/stream-itinerary` & `/api/refine-itinerary`) and are **never exposed to the client browser**.

### Running the Application
```bash
# Development server with live hot reloading
npm run dev

# Or compile and start the production bundle
npm run build && npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start planning trips!

---

## Usage Guide

1. **Generate a Trip:** On the home screen, enter any free-form travel idea (e.g., *"A 3-day adventure in Iceland focused on waterfalls and hot springs"*), or click one of the quick-select example pills. Press `Enter` (`Ctrl + Enter`) or click **Generate**.
2. **Watch Live Streaming:** Observe the live terminal initialization sequence while the structured itinerary streams dynamically into interactive cards.
3. **Interact & Customize:**
   - **Reorder Schedule:** Drag the grip handle on any stop card to reorder activities across the day's timeline.
   - **Expand/Remove Stops:** Click a card to read full practical advice and category badges, or click `X` to remove a stop.
   - **Checklists & Budgets:** Inspect the `Estimated Budget Breakdown` chart and check off items inside your `Packing Essentials` checklist.
4. **Iterative Refinement:** Use the bottom input box (`Refine Itinerary`) to ask for follow-up adjustments without losing context or restarting from scratch.
5. **Manage Past Trips:** Click the **Previous Trips** button in the top right to slide open the session archive drawer, load previous itineraries, or export/import `.json` backup files.

---

## AI-Usage Note

In the spirit of honesty and engineering transparency, I actively utilized AI coding assistants during the development of AtlasAI. However, I approached AI as a **high-leverage collaborative accelerator** rather than relying on automated "vibe coding." Every line of code, architectural boundary, and data structure was intentionally designed, verified, and owned by me.

### Where AI Was Used as an Accelerator
- **Boilerplate & CSS Scaffolding:** Generating initial Tailwind CSS utility layouts, responsive grid syntax, and repetitive component markup.
- **Visual Effects & Micro-Animations:** Prototyping complex mathematical canvas and CSS animations (`LetterGlitch`, `BorderBeam`, `SpotlightCard`, and `MetallicPaint`).
- **Standard Library Boilerplate:** Scaffolding initial sensor configurations (`useSensor`, `KeyboardSensor`) for `@dnd-kit`.

### Where Human Engineering & Architecture Drove the Project
- **System Architecture & Schema Design:** I engineered the multi-tier structured JSON contract (`itinerary.days`, `itinerary.blocks`) that enables deterministic React component rendering from non-deterministic LLM text outputs.
- **Resilience & Auto-Repair Engineering (`parseItinerary.js`):** LLMs frequently produce broken or truncated JSON when hitting token limits. I designed and wrote the multi-layer parsing stack (`attemptRepairTruncatedJSON`) that dynamically inspects syntax trees, auto-closes unterminated arrays/objects, and salvages partial streaming responses cleanly without crashing the UI.
- **Concurrency & Race Condition Prevention (`useItinerary.js`):** I architected the asynchronous state machine using `AbortController` and `currentRequestId.current` tracking. If a user rapidly fires multiple prompts or clicks back mid-stream, older network requests are immediately aborted to prevent stale async responses from corrupting application state.
- **Interactive State & Data Persistence:** I manually structured the per-day reordering logic, checkable checklist persistence, and `localStorage` JSON import/export workflows to ensure a seamless user experience across browser sessions.

---

## Known Limitations

- **Large Context Prompts:** If a user requests an extraordinarily long itinerary (e.g., a 30-day trip with 12 stops per day), the LLM's response length may exceed maximum output token limits. However, our multi-layer parser is engineered to auto-repair and display all valid days up to the cutoff point.
- **Dynamic Image Loading:** Destination thumbnail images are fetched dynamically via external image generation URLs based on stop names. If external image servers experience high network latency, clean local gradient fallbacks (`https://images.unsplash.com/...`) are rendered automatically.

---

## Time Spent & Breakdown

- **Total Time Spent:** ~7 hours
  - **UI/UX & Interactive Components (~3 hours):** Responsive day sections, drag-and-drop stop cards, dynamic budget/checklist blocks, and modal layouts.
  - **Backend API Routing & Prompting (~1 hour):** Strict JSON schema system prompts and server-side streaming endpoints.
  - **Error Handling & Parser Machine (~1.5 hours):** `parseItinerary.js` auto-repair logic, race condition tracking, and `useItinerary` state machine.
  - **Polish & Session Caching (~1.5 hours):** `localStorage` session archiving, JSON file import/export, keyboard accessibility, and production build checks.
