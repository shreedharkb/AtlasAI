"use client";

import DecryptedText from "@/components/react-bits/decrypted-text";
import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/magicui/terminal";
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";

/**
 * Streaming / loading state — shows the progress bar, terminal, and live stream preview.
 */
export default function LoadingView({ appState, progress, streamingText, onCancel }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 mt-8">
      <div className="relative z-10 flex flex-col items-center transform scale-110">
        <AnimatedCircularProgressBar
          max={100}
          min={0}
          value={progress}
          gaugePrimaryColor="rgb(255 255 255)"
          gaugeSecondaryColor="rgba(255, 255, 255, 0.15)"
          className="text-white mb-8"
        />
        <div className="text-3xl md:text-5xl font-mono text-white text-center h-20">
          <DecryptedText
            text={appState === "streaming" ? "Receiving itinerary data..." : "Formulating perfect itinerary..."}
            speed={40}
            maxIterations={15}
            animateOn="view"
            className="text-white font-bold"
            encryptedClassName="text-amber-300 font-mono"
          />
        </div>

        <div className="mt-8 w-full max-w-3xl">
          <Terminal>
            <TypingAnimation duration={30}>&gt; Initializing Groq llama-3.3-70b...</TypingAnimation>

            {appState === "streaming" && (
              <AnimatedSpan delay={200} className="text-white block mt-4">
                <span className="block text-amber-300/80 font-serif italic text-sm mb-2">✦ Live Atlas AI Stream...</span>
                <span className="font-mono text-xs text-white/80 whitespace-pre-wrap break-all opacity-70 line-clamp-6">
                  {streamingText}
                </span>
              </AnimatedSpan>
            )}
            {!streamingText && (
              <>
                <AnimatedSpan delay={300} className="text-amber-300">✔ Parsing travel constraints.</AnimatedSpan>
                <AnimatedSpan delay={600} className="text-amber-300">✔ Cross-referencing local secrets.</AnimatedSpan>
              </>
            )}
          </Terminal>
        </div>

        <button
          onClick={onCancel}
          className="mt-8 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
