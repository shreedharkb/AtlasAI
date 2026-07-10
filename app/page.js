"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LetterGlitch from "@/components/react-bits/letter-glitch";
import { HyperText } from "@/components/magicui/hyper-text";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { RippleButton } from "@/components/magicui/ripple-button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/magicui/terminal";
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import ShinyText from "@/components/react-bits/shiny-text";
import BorderGlow from "@/components/react-bits/border-glow";
import DecryptedText from "@/components/react-bits/decrypted-text";
import ShapeGrid from "@/components/react-bits/shape-grid";
import SpotlightCard from "@/components/react-bits/spotlight-card";
import PixelCard from "@/components/react-bits/pixel-card";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Plane, History, ArrowLeft, X, Save, RefreshCw } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { useItinerary } from "@/hooks/useItinerary";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PixelImage } from "@/components/magicui/pixel-image";
import { EXAMPLE_PROMPTS, ERROR_MESSAGES, CATEGORIES, getDestinationImage, ATLAS_AI_LOGO_SVG } from "@/lib/constants";
import MetallicPaint from "@/components/react-bits/metallic-paint";
import DaySection from "@/components/day-section";
import BlockCard from "@/components/block-card";
import SessionDrawer from "@/components/session-drawer";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selectedStop, setSelectedStop] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");

  const {
    state: appState, // idle | loading | streaming | success | error
    itinerary,
    error,
    streamingText,
    generateItinerary,
    refineItinerary,
    removeStop,
    reorderStops,
    toggleDayExpand,
    reset,
    loadItinerary,
  } = useItinerary();

  const {
    sessions,
    saveSession,
    loadSession,
    deleteSession,
  } = useLocalStorage();

  // Progress Bar Effect (fake progress up to 85% until success)
  useEffect(() => {
    let interval;
    let timer;
    if (appState === "loading" || appState === "streaming") {
      timer = setTimeout(() => setProgress(0), 0);
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 85 : prev + Math.random() * 15));
      }, 800);
    } else if (appState === "success") {
      timer = setTimeout(() => setProgress(100), 0);
    } else {
      timer = setTimeout(() => setProgress(0), 0);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [appState]);

  const handleGenerate = () => {
    if (prompt.trim()) {
      generateItinerary(prompt);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleGenerate();
    }
  };

  const handleRefine = () => {
    if (refinePrompt.trim()) {
      refineItinerary(refinePrompt);
      setRefinePrompt("");
    }
  };

  const handleSave = () => {
    saveSession(prompt, itinerary);
    setIsDrawerOpen(true);
  };

  const handleLoadSession = (id) => {
    const session = loadSession(id);
    if (session) {
      loadItinerary(session);
      setPrompt(session.prompt || "");
      setIsDrawerOpen(false);
    }
  };

  const handleBack = () => {
    reset(); // Aborts in-flight and resets
    setPrompt("");
  };

  const getErrorContent = () => {
    if (!error) return null;
    const errorInfo = Object.values(ERROR_MESSAGES).find((e) => e.type === error.type) || ERROR_MESSAGES.SERVER_ERROR;
    return (
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 mt-8">
        <div className="relative z-10 flex flex-col items-center bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-red-500/30 max-w-lg text-center shadow-2xl">
          <X className="w-16 h-16 text-red-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">{errorInfo.title}</h2>
          <p className="text-zinc-400 mb-4">{errorInfo.description}</p>
          {error.message && (
            <p className="text-xs text-red-400/60 mb-8 bg-black/20 p-2 rounded max-w-full overflow-hidden text-ellipsis">{error.message}</p>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
            >
              Go Back
            </button>
            <div onClick={handleGenerate}>
              <ShinyButton>Try Again</ShinyButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-zinc-950">
      {/* Background Component */}
      {(appState === "idle" || appState === "loading" || appState === "streaming" || appState === "error") && (
        <div className="absolute inset-0 z-0 opacity-40">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
          />
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="relative z-20 w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center text-white cursor-pointer group" onClick={handleBack}>
          <div className="w-48 sm:w-60 h-14 sm:h-16 -ml-4 -my-3 relative transition-transform duration-300 group-hover:scale-105">
            <MetallicPaint
              imageSrc={ATLAS_AI_LOGO_SVG}
              lightColor="#ffffff"
              darkColor="#047857"
              tintColor="#34d399"
              liquid={0.75}
              speed={0.4}
              scale={1.8}
              brightness={1.4}
              contrast={1.4}
              refraction={0.02}
            />
          </div>
        </div>
        <ShimmerButton
          onClick={() => setIsDrawerOpen(true)}
          shimmerColor="#34d399"
          shimmerSize="0.08em"
          shimmerDuration="2.5s"
          borderRadius="16px"
          background="rgba(18, 24, 27, 0.85)"
          className="shadow-2xl border border-white/15 hover:border-emerald-500/50 transition-all px-4 py-2 flex items-center gap-2"
        >
          {sessions?.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgb(52,211,153)]" />
          )}
          <span className="font-sans font-semibold text-sm tracking-tight text-white/90">
            Previous Trips
          </span>
          {sessions?.length > 0 && (
            <span className="ml-0.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-300">
              {sessions.length}
            </span>
          )}
        </ShimmerButton>
      </nav>

      {/* Idle / Input State */}
      {appState === "idle" && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 text-center max-w-4xl mx-auto -mt-16">
          <HyperText
            className="text-4xl md:text-7xl font-bold tracking-tight text-white drop-shadow-xl"
            duration={800}
          >
            Next Stop?
          </HyperText>
          <div className="mt-6 text-lg md:text-xl font-medium tracking-wide">
            <ShinyText
              text="Describe your dream trip, and let AI craft the perfect day-by-day itinerary."
              disabled={false}
              speed={3}
              className="custom-class"
            />
          </div>

          {/* Example Prompts */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl">
            {EXAMPLE_PROMPTS.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(ep.text)}
                className="px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-all duration-200"
              >
                {ep.title}
              </button>
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
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., A 5-day food tour in Tokyo focusing on sushi and street food, moderate budget..."
                  className="w-full h-32 bg-transparent text-white p-4 outline-none resize-none placeholder:text-white/30 text-lg"
                />
                <div className="flex justify-between items-center px-4 pb-2">
                  <span className="text-xs text-white/40 hidden sm:inline">Press Ctrl+Enter to submit</span>
                  <span className="text-xs text-white/40 sm:hidden">Powered by Groq</span>
                  <ShinyButton
                    onClick={handleGenerate}
                    className="flex-shrink-0 ml-2"
                  >
                    Generate Trip
                  </ShinyButton>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      )}

      {/* Error State */}
      {appState === "error" && getErrorContent()}

      {/* Loading / Streaming State */}
      {(appState === "loading" || appState === "streaming") && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 mt-8">
          <div className="relative z-10 flex flex-col items-center transform scale-110">
            <AnimatedCircularProgressBar
              max={100}
              min={0}
              value={progress}
              gaugePrimaryColor="rgb(52 211 153)"
              gaugeSecondaryColor="rgba(255, 255, 255, 0.1)"
              className="text-white mb-8"
            />
            <div className="text-3xl md:text-5xl font-mono text-white text-center h-20">
              <DecryptedText
                text={appState === "streaming" ? "Receiving itinerary data..." : "Formulating perfect itinerary..."}
                speed={40}
                maxIterations={15}
                animateOn="view"
                className="text-white font-bold"
                encryptedClassName="text-emerald-400 font-mono"
              />
            </div>

            <div className="mt-8 w-full max-w-3xl">
              <Terminal>
                <TypingAnimation duration={30}>&gt; Initializing Groq llama-3.3-70b...</TypingAnimation>

                {appState === "streaming" && (
                  <AnimatedSpan delay={200} className="text-emerald-400 block mt-4">
                    <span className="block text-white/50 text-xs uppercase tracking-widest mb-2">Incoming Stream</span>
                    <span className="font-mono text-xs text-white/80 whitespace-pre-wrap break-all opacity-70 line-clamp-6">
                      {streamingText}
                    </span>
                  </AnimatedSpan>
                )}
                {!streamingText && (
                  <>
                    <AnimatedSpan delay={300} className="text-emerald-400">✔ Parsing travel constraints.</AnimatedSpan>
                    <AnimatedSpan delay={600} className="text-emerald-400">✔ Cross-referencing local secrets.</AnimatedSpan>
                  </>
                )}
              </Terminal>
            </div>

            <button
              onClick={handleBack}
              className="mt-8 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {appState === "success" && itinerary && (
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

          {/* Combined Hero PixelCard: Clubs the Title/Summary/Buttons card together with the 4K Destination PixelImage */}
          <PixelCard className="relative z-10 w-full mb-8 overflow-hidden rounded-3xl border border-white/15 bg-zinc-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/25">
            {/* Top 4K PixelImage Banner Area */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden border-b border-white/10">
              <PixelImage
                src={getDestinationImage(itinerary.tripTitle + " " + itinerary.summary, itinerary.destination || itinerary.tripTitle, 99)}
                customGrid={{ rows: 6, cols: 10 }}
                grayscaleAnimation={true}
                className="w-full h-full rounded-none"
              />
              {/* Subtle gradient overlay from bottom so image blends smoothly into the text card below */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Header Content Area Clubbed Together inside the same PixelCard */}
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
                    encryptedClassName="text-emerald-400 font-mono leading-tight"
                  />
                </div>
                <p className="font-sans text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed">
                  {itinerary.summary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                <RippleButton
                  onClick={handleSave}
                  rippleColor="#ADD8E6"
                  className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-sans font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105 border-none"
                >
                  <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Save Trip</span>
                </RippleButton>
                <RippleButton
                  onClick={handleBack}
                  rippleColor="#ADD8E6"
                  className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 border border-white/15 text-white font-sans font-medium px-6 py-3 rounded-full shadow-md transition-all hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Start Over</span>
                </RippleButton>
              </div>
            </div>
          </PixelCard>

          {/* Main Layout Tier 1: Days on left (2/3 width), Refine & Budget on right (1/3 width) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 space-y-3.5">
              {itinerary.days.map((day, dayIndex) => (
                <DaySection
                  key={day.id}
                  day={day}
                  dayIndex={dayIndex}
                  destination={itinerary.destination || itinerary.tripTitle || ""}
                  onReorderStops={reorderStops}
                  onRemoveStop={removeStop}
                  onSelectStop={setSelectedStop}
                  onToggleExpand={toggleDayExpand}
                />
              ))}
            </div>

            <div className="space-y-4">
              {/* Refinement Box */}
              <div className="relative rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 overflow-hidden shadow-xl hover:border-white/20 transition-all duration-300">
                <BorderBeam colorFrom="#34d399" colorTo="#3b82f6" duration={10} size={180} borderWidth={1.5} />
                <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                  <span className="p-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 flex-shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-medium text-white tracking-tight">
                    Refine Itinerary
                  </h4>
                </div>
                <div className="flex flex-col gap-3 mt-1">
                  <textarea
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder="e.g. Make day 2 cheaper, add more museums..."
                    className="w-full h-24 bg-black/40 text-white p-3.5 rounded-2xl border border-white/10 outline-none resize-none placeholder:text-white/30 font-sans text-sm focus:border-emerald-500/50 transition-all"
                  />
                  <RippleButton
                    onClick={handleRefine}
                    disabled={!refinePrompt.trim()}
                    rippleColor="#ADD8E6"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-zinc-950 font-sans font-semibold rounded-2xl transition-all text-sm border-none shadow-md hover:scale-[1.01]"
                  >
                    Update Itinerary
                  </RippleButton>
                </div>
              </div>

              {/* Budget Block right underneath Refine Box in the sidebar */}
              {itinerary.blocks?.filter((b) => b.type === "budget").map((block, idx) => (
                <BlockCard key={`budget-${idx}`} block={block} />
              ))}
            </div>
          </div>

          {/* Main Layout Tier 2: Full-Width 2-Column Grid for Checklist, Tips & other Blocks */}
          {itinerary.blocks && itinerary.blocks.filter((b) => b.type !== "budget").length > 0 && (
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
              {itinerary.blocks
                .filter((b) => b.type !== "budget")
                .map((block, idx) => (
                  <BlockCard key={`other-${idx}`} block={block} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Session Drawer */}
      {isDrawerOpen && (
        <SessionDrawer
          sessions={sessions}
          onLoad={handleLoadSession}
          onDelete={deleteSession}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Stop Detail Modal */}
      {selectedStop && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setSelectedStop(null)}
        >
          <SpotlightCard
            spotlightColor="rgba(99, 102, 241, 0.2)"
            className="relative w-full max-w-xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <BorderBeam colorFrom="#34d399" colorTo="#a855f7" duration={4} size={80} borderWidth={1.5} />
            <button
              onClick={() => setSelectedStop(null)}
              className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/90 backdrop-blur-md p-2 rounded-full text-white/80 hover:text-white transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* High Resolution PixelImage Stop Header without text overlays */}
            <div className="w-full h-52 relative border-b border-white/10 overflow-hidden">
              <PixelImage
                src={getDestinationImage(selectedStop.name + " " + (selectedStop.description || "") + " " + selectedStop.category)}
                customGrid={{ rows: 4, cols: 6 }}
                grayscaleAnimation={true}
                className="w-full h-full rounded-t-3xl rounded-b-none"
              />
            </div>

            <div className="p-8 pt-6">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const cat = CATEGORIES[selectedStop.category] || CATEGORIES.other;
                  const Icon = LucideIcons[cat.iconName] || LucideIcons.MapPin;
                  return (
                    <div className={`p-2 rounded-full border ${cat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <h2 className="text-2xl font-bold text-white">{selectedStop.name}</h2>
              </div>
              <div className="flex gap-4 mb-6 text-sm text-emerald-400 font-medium">
                {selectedStop.time && <span>{selectedStop.time}</span>}
                {selectedStop.duration && <span>Duration: {selectedStop.duration}</span>}
              </div>
              <div className="text-white/80 leading-relaxed text-base border-l-2 border-emerald-500/50 pl-4 mb-6">
                <p>{selectedStop.description || "No description provided."}</p>
              </div>
              {selectedStop.tips && (
                <div className="bg-white/5 rounded-xl p-4">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 block">Travel Tip</span>
                  <p className="text-white/90 text-sm">{selectedStop.tips}</p>
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>
      )}
    </main>
  );
}
