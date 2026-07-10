# Trip Planner Assignment Submission

**Name:** Shreedhar K B  
**Assignment Chosen:** Trip Planner  
**Degree:** B.Tech  
**Branch/Stream:** CSE / Data Science & AI  

### Links
* **Live Web App:** [https://atlas-ai-teal.vercel.app/](https://atlas-ai-teal.vercel.app/)
* **Demo Video:** [https://drive.google.com/file/d/1oP2M6L_jw4FbMLUodHXG7X_r01Ryudnm/view?usp=sharing](https://drive.google.com/file/d/1oP2M6L_jw4FbMLUodHXG7X_r01Ryudnm/view?usp=sharing)
* **GitHub Repository:** https://github.com/shreedharkb/AtlasAI.git

---

### Executive Summary & Overview
**AtlasAI** transforms open-ended, natural language travel prompts into **structured, interactive, and stateful UI components**. Rather than acting as a traditional text-based chatbot, AtlasAI parses user requests into concrete JSON schemas and renders dynamic daily schedules, interactive cost breakdown charts, checkable packing lists, and drag-and-drop itinerary planners using **React**, **Next.js (App Router)**, and the **Groq API**.

### Handling Bad AI Output (Engineering Highlight)
Handling LLM failure modes gracefully is the architectural highlight of this project:
1. **Multi-Layer Truncated JSON Auto-Repair:** If the AI truncates output mid-stream due to token limits, an intelligent auto-repair stack iteratively closes open brackets and salvages valid data up to the truncation point.
2. **Race Condition Prevention:** Implements request-ID tracking combined with `AbortController`. Rapid successive submissions automatically cancel older in-flight requests so stale data never overwrites new results.

### AI-Usage Note
In the spirit of transparency: I actively used AI coding assistants to help prototype UI boilerplate, write standard Tailwind CSS utility classes, and scaffold repetitive component code.

However, I took complete ownership of the system architecture, debugging, and core engineering logic:
* **System Architecture & JSON Contract:** I personally designed the structured JSON schema that bridges LLM output with deterministic React UI components.
* **Resilience & Auto-Repair Engineering:** I engineered the multi-layer parser to auto-close open brackets and salvage streaming data cleanly without crashing the app.
* **Race Condition Prevention:** I designed the asynchronous state machine using `AbortController` and request-ID tracking.

Using AI as a collaborative accelerator allowed me to deliver a significantly more polished and production-ready application while maintaining full understanding and control over every single line of code.
