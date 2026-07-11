"use client";

import { X } from "lucide-react";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { ERROR_MESSAGES } from "@/lib/constants";

/**
 * Error state — glassmorphic card with error details, "Go Back" and "Try Again" actions.
 */
export default function ErrorView({ error, onBack, onRetry }) {
  if (!error) return null;

  const errorInfo =
    Object.values(ERROR_MESSAGES).find((e) => e.type === error.type) ||
    ERROR_MESSAGES.SERVER_ERROR;

  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 mt-8">
      <div className="relative z-10 flex flex-col items-center bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-red-500/30 max-w-lg text-center shadow-2xl">
        <X className="w-16 h-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">{errorInfo.title}</h2>
        <p className="text-zinc-400 mb-4">{errorInfo.description}</p>
        {error.message && (
          <p className="text-xs text-red-400/60 mb-8 bg-black/20 p-2 rounded max-w-full overflow-hidden text-ellipsis">
            {error.message}
          </p>
        )}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
          >
            Go Back
          </button>
          <div onClick={onRetry}>
            <ShinyButton>Try Again</ShinyButton>
          </div>
        </div>
      </div>
    </div>
  );
}
