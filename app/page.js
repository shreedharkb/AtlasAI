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
import SpotlightCard from "@/components/react-bits/spotlight-card";
import PixelCard from "@/components/react-bits/pixel-card";
import ShapeGrid from "@/components/react-bits/shape-grid";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Plane, History, ArrowLeft, X, Save, RefreshCw } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { useItinerary } from "@/hooks/useItinerary";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PixelImage } from "@/components/magicui/pixel-image";
import { EXAMPLE_PROMPTS, ERROR_MESSAGES, CATEGORIES, getDestinationImage, ATLAS_AI_LOGO_SVG } from "@/lib/constants";
import { playKeySound as playKeyboardSound } from "@/components/ui/keyboard";
import MetallicPaint from "@/components/react-bits/metallic-paint";
import DaySection from "@/components/day-section";
import BlockCard from "@/components/block-card";
import SessionDrawer from "@/components/session-drawer";
import { ParallaxScroll } from "@/components/ui/parallax-scroll";

const PARALLAX_IMAGES = [
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1500&q=80",
];

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
    importSession,
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

  // Global mechanical keyboard ASMR sound effect and keyboard navigation (`Escape` to close open modals)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      playKeyboardSound(e);
      if (e.key === "Escape") {
        if (selectedStop) setSelectedStop(null);
        else if (isDrawerOpen) setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedStop, isDrawerOpen]);

  const handleGenerate = () => {
    if (prompt.trim()) {
      playKeyboardSound("Enter");
      generateItinerary(prompt);
    }
  };

  const handleKeyDown = (e) => {
    playKeyboardSound(e);
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleGenerate();
    }
  };

  const handleRefine = () => {
    if (refinePrompt.trim()) {
      playKeyboardSound("Enter");
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
      {/* Background Component: Aceternity UI Parallax Scroll + Aurora + Hexagonal Globe Map Grid */}
      {(appState === "idle" || appState === "loading" || appState === "streaming" || appState === "error") && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
          {/* Moving 3-Column Parallax Scroll Images in the Background */}
          <ParallaxScroll images={PARALLAX_IMAGES} autoMove={true} />

          {/* Aceternity UI Aurora Atmospheric Glows */}
          <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent blur-3xl pointer-events-none animate-pulse duration-10000" />
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-cyan-500/15 via-blue-500/10 to-transparent blur-3xl pointer-events-none animate-pulse duration-7000" />
          <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-violet-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="relative z-20 w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center text-white cursor-pointer group" onClick={handleBack}>
          <div className="w-44 sm:w-52 h-44 sm:h-52 -ml-3 sm:-ml-4 -my-14 sm:-my-16 relative transition-transform duration-300 group-hover:scale-105">
            <MetallicPaint
              imageSrc={ATLAS_AI_LOGO_SVG}
              lightColor="#ffffff"
              darkColor="#d4d4d8"
              tintColor="#ffffff"
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
          shimmerColor="#ffffff"
          shimmerSize="0.1em"
          shimmerDuration="2s"
          borderRadius="16px"
          background="rgba(255, 255, 255, 0.12)"
          className="shadow-2xl backdrop-blur-md border border-white/30 hover:border-white/60 hover:bg-white/20 transition-all px-4 py-2 flex items-center gap-2"
        >
          {sessions?.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          )}
          <span className="font-sans font-semibold text-sm tracking-tight text-white drop-shadow">
            Previous Trips
          </span>
          {sessions?.length > 0 && (
            <span className="ml-0.5 px-2 py-0.5 rounded-full bg-white/20 border border-white/40 text-[11px] font-mono font-bold text-white shadow-sm">
              {sessions.length}
            </span>
          )}
        </ShimmerButton>
      </nav>

      {/* Idle / Input State */}
      {appState === "idle" && (
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
                    encryptedClassName="text-amber-300 font-mono leading-tight"
                  />
                </div>
                <p className="font-sans text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed">
                  {itinerary.summary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                <ShimmerButton
                  onClick={handleSave}
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
                  onClick={handleBack}
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

          {/* Main Layout Tier 1: Days Section Full Width */}
          <div className="relative z-10 w-full space-y-3.5">
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

          {/* Main Layout Tier 2: Refinement Box (Img 3) and Budget Chart (Img 2) side-by-side */}
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
                  onClick={handleRefine}
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

            {/* Budget / Chart Block side by side with Refinement Box */}
            <div className="flex flex-col h-full">
              {itinerary.blocks?.filter((b) => b.type === "budget" || b.type === "chart").map((block, idx) => (
                <BlockCard key={`budget-${idx}`} block={block} />
              ))}
            </div>
          </div>

          {/* Main Layout Tier 3: Checklist (Img 1 left) & Tips (Img 1 right) side-by-side */}
          {itinerary.blocks && itinerary.blocks.filter((b) => b.type !== "budget" && b.type !== "chart").length > 0 && (
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full items-stretch">
              {itinerary.blocks
                .filter((b) => b.type !== "budget" && b.type !== "chart")
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
          onImport={importSession}
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
              <div className="flex items-center gap-3.5 mb-3">
                {(() => {
                  const cat = CATEGORIES[selectedStop.category] || CATEGORIES.other;
                  const Icon = LucideIcons[cat.iconName] || LucideIcons.MapPin;
                  return (
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 text-amber-300 shadow-sm flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">{selectedStop.name}</h2>
              </div>
              <div className="flex gap-4 mb-6 text-sm text-amber-300/90 font-mono">
                {selectedStop.time && <span>🕒 {selectedStop.time}</span>}
                {selectedStop.duration && <span>⌛ {selectedStop.duration}</span>}
              </div>
              <div className="text-white/85 leading-relaxed text-base sm:text-lg font-sans border-l-2 border-amber-400/50 pl-4 mb-6">
                <p>{selectedStop.description || "No description provided."}</p>
              </div>
              {selectedStop.tips && (
                <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <h4 className="font-serif text-amber-300 font-medium mb-2 flex items-center gap-2 text-base">
                    ✦ Insider Tip
                  </h4>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed font-sans">{selectedStop.tips}</p>
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>
      )}
    </main>
  );
}
