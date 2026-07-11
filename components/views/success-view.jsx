"use client";

import React, { useMemo } from "react";
import { Save, ArrowLeft, RefreshCw } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BorderBeam } from "@/components/magicui/border-beam";
import DecryptedText from "@/components/react-bits/decrypted-text";
import PixelCard from "@/components/react-bits/pixel-card";
import ShapeGrid from "@/components/react-bits/shape-grid";
import { PixelImage } from "@/components/magicui/pixel-image";
import { getDestinationImage } from "@/lib/constants";
import DaySection from "@/components/day-section";
import BlockCard from "@/components/block-card";
import { playKeySound as playKeyboardSound } from "@/components/ui/keyboard";

/**
 * The main itinerary result view — hero card, day sections, blocks, and refinement box.
 */
function SuccessView({
  itinerary,
  warnings,
  onSave,
  onBack,
  onReorderStops,
  onRemoveStop,
  onSelectStop,
  onToggleExpand,
  refinePrompt,
  setRefinePrompt,
  onRefine,
}) {
  // Memoize block filtering to avoid recomputing on every keystroke in the refine textarea
  const budgetBlocks = useMemo(
    () => (itinerary.blocks || []).filter((b) => b.type === "budget" || b.type === "chart"),
    [itinerary.blocks]
  );

  const otherBlocks = useMemo(
    () => (itinerary.blocks || []).filter((b) => b.type !== "budget" && b.type !== "chart"),
    [itinerary.blocks]
  );

  return (
    <div className="relative z-10 flex flex-col flex-1 w-full max-w-5xl mx-auto px-4 mt-4 pb-24">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <ShapeGrid
          direction="diagonal"
          speed={0.5}
          borderColor="#27272a"
          squareSize={45}
          hoverFillColor="#3f3f46"
          shape="hexagon"
          hoverTrailAmount={2}
        />
      </div>

      {/* Parser warnings banner */}
      {warnings && warnings.length > 0 && (
        <div className="relative z-10 mb-4 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md">
          <p className="text-amber-300 text-xs sm:text-sm font-sans">
            <span className="font-semibold">⚠ Note:</span>{" "}
            {warnings.join(" · ")}
          </p>
        </div>
      )}

      {/* Combined Hero PixelCard */}
      <PixelCard className="relative z-10 w-full mb-8 overflow-hidden rounded-3xl border border-white/15 bg-zinc-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/25">
        {/* Top 4K PixelImage Banner */}
        <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden border-b border-white/10">
          <PixelImage
            src={getDestinationImage(itinerary.tripTitle + " " + itinerary.summary, itinerary.destination || itinerary.tripTitle, 99)}
            customGrid={{ rows: 6, cols: 10 }}
            grayscaleAnimation={true}
            className="w-full h-full rounded-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Header Content */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex-1 min-w-0 pr-0 sm:pr-4">
            <div className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-3 tracking-tight leading-tight">
              <DecryptedText
                text={itinerary.tripTitle}
                speed={40}
                maxIterations={20}
                animateOn="view"
                parentClassName="block font-serif tracking-tight leading-tight"
                className="text-white font-serif tracking-tight leading-tight"
                encryptedClassName="text-amber-300 font-mono leading-tight"
              />
            </div>
            <p className="font-sans text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed">
              {itinerary.summary}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <ShimmerButton
              onClick={onSave}
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="9999px"
              background="rgba(255, 255, 255, 0.2)"
              className="flex-1 sm:flex-initial backdrop-blur-md border border-white/40 hover:border-white/80 hover:bg-white/30 text-white font-sans font-semibold px-6 py-3 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>Save Trip</span>
            </ShimmerButton>
            <ShimmerButton
              onClick={onBack}
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="9999px"
              background="rgba(255, 255, 255, 0.12)"
              className="flex-1 sm:flex-initial backdrop-blur-md border border-white/25 hover:border-white/60 hover:bg-white/20 text-white font-sans font-medium px-6 py-3 rounded-full shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>Start Over</span>
            </ShimmerButton>
          </div>
        </div>
      </PixelCard>

      {/* Days Section */}
      <div className="relative z-10 w-full space-y-3.5">
        {itinerary.days.map((day, dayIndex) => (
          <MemoizedDaySection
            key={day.id}
            day={day}
            dayIndex={dayIndex}
            destination={itinerary.destination || itinerary.tripTitle || ""}
            onReorderStops={onReorderStops}
            onRemoveStop={onRemoveStop}
            onSelectStop={onSelectStop}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>

      {/* Refinement Box + Budget Chart side-by-side */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full items-stretch">
        {/* Refinement Box */}
        <div className="relative rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 overflow-hidden shadow-xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
          <BorderBeam colorFrom="#ffffff" colorTo="#facc15" duration={10} size={180} borderWidth={1.5} />
          <div>
            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 text-amber-300 flex-shrink-0 shadow-sm">
                <RefreshCw className="w-5 h-5" />
              </span>
              <h4 className="font-serif text-lg sm:text-xl font-medium text-white tracking-tight">
                Refine Itinerary
              </h4>
            </div>
            <p className="text-white/60 text-xs sm:text-sm font-sans mb-3">
              Customize any part of this trip. Ask Atlas AI to tweak activities, budgets, or travel pacing.
            </p>
          </div>
          <div className="flex flex-col gap-3.5 mt-3 flex-1">
            <textarea
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={(e) => playKeyboardSound(e)}
              placeholder="e.g. Make day 2 cheaper, add more museums, change hotel to boutique..."
              className="w-full flex-1 min-h-[150px] bg-black/40 text-white p-4 rounded-2xl border border-white/10 outline-none resize-none placeholder:text-white/30 font-sans text-sm sm:text-base focus:border-amber-400/50 focus:bg-black/60 transition-all shadow-inner leading-relaxed"
            />
            <ShimmerButton
              onClick={onRefine}
              disabled={!refinePrompt.trim()}
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="16px"
              background="rgba(255, 255, 255, 0.2)"
              className="w-full py-3.5 backdrop-blur-md border border-white/40 hover:border-white/80 hover:bg-white/30 disabled:opacity-40 disabled:hover:bg-white/10 text-white font-sans font-semibold rounded-2xl transition-all text-sm sm:text-base shadow-md flex items-center justify-center flex-shrink-0"
            >
              Update Itinerary
            </ShimmerButton>
          </div>
        </div>

        {/* Budget / Chart Blocks */}
        <div className="flex flex-col h-full">
          {budgetBlocks.map((block, idx) => (
            <MemoizedBlockCard key={`budget-${idx}`} block={block} />
          ))}
        </div>
      </div>

      {/* Checklist & Tips Blocks */}
      {otherBlocks.length > 0 && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full items-stretch">
          {otherBlocks.map((block, idx) => (
            <MemoizedBlockCard key={`other-${idx}`} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized wrappers to prevent re-renders when refine textarea changes
const MemoizedDaySection = React.memo(DaySection);
const MemoizedBlockCard = React.memo(BlockCard);

export default React.memo(SuccessView);
