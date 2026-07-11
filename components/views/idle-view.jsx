"use client";

import { HyperText } from "@/components/magicui/hyper-text";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import ShinyText from "@/components/react-bits/shiny-text";
import BorderGlow from "@/components/react-bits/border-glow";
import { EXAMPLE_PROMPTS } from "@/lib/constants";

/**
 * Landing screen — the hero prompt input with example chips.
 */
export default function IdleView({ prompt, setPrompt, onGenerate, onKeyDown }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 text-center max-w-4xl mx-auto -mt-16">
      <HyperText
        className="font-display uppercase text-3xl sm:text-5xl md:text-6xl font-bold tracking-widest text-white drop-shadow-xl py-1"
        duration={800}
      >
        WHERE TO NEXT?
      </HyperText>
      <div className="mt-3 text-base sm:text-lg md:text-xl font-serif italic font-normal tracking-wide text-white/85 drop-shadow max-w-xl mx-auto leading-relaxed">
        <ShinyText
          text="Describe your dream trip, and let AI craft the perfect day-by-day itinerary."
          disabled={false}
          speed={3}
          className="font-serif italic text-white/85"
        />
      </div>

      {/* Example Prompts */}
      <div className="flex flex-wrap justify-center gap-2.5 mt-8 max-w-2xl">
        {EXAMPLE_PROMPTS.map((ep, idx) => (
          <ShimmerButton
            key={idx}
            onClick={() => setPrompt(ep.text)}
            shimmerColor="#ffffff"
            shimmerSize="0.08em"
            shimmerDuration="2s"
            borderRadius="9999px"
            background="rgba(255, 255, 255, 0.12)"
            className="px-4 py-2 shadow-xl backdrop-blur-md border border-white/30 hover:border-white/60 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-all duration-200"
          >
            {ep.title}
          </ShimmerButton>
        ))}
      </div>

      {/* The Prompt Input */}
      <div className="w-full max-w-2xl mt-6">
        <BorderGlow
          className="w-full text-left"
          glowColor="52 211 153"
          backgroundColor="#000000"
          borderRadius={24}
          glowIntensity={0.8}
          animated={true}
        >
          <div className="relative flex flex-col p-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g., A 5-day food tour in Tokyo focusing on sushi and street food, moderate budget..."
              className="w-full h-32 bg-transparent text-white p-4 outline-none resize-none placeholder:text-white/30 text-lg"
            />
            <div className="flex justify-between items-center px-4 pb-2">
              <span className="text-xs text-white/40 hidden sm:inline">Press Ctrl+Enter to submit</span>
              <span className="text-xs text-white/40 sm:hidden">Powered by Groq</span>
              <ShinyButton
                onClick={onGenerate}
                className="flex-shrink-0 ml-2"
              >
                Generate Trip
              </ShinyButton>
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
}
