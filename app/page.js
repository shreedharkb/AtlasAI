"use client";

import { useState, useEffect } from "react";
import { ParallaxScroll } from "@/components/ui/parallax-scroll";
import MetallicPaint from "@/components/react-bits/metallic-paint";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { useItinerary } from "@/hooks/useItinerary";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ATLAS_AI_LOGO_SVG } from "@/lib/constants";
import { playKeySound as playKeyboardSound } from "@/components/ui/keyboard";

// View Components
import IdleView from "@/components/views/idle-view";
import LoadingView from "@/components/views/loading-view";
import ErrorView from "@/components/views/error-view";
import SuccessView from "@/components/views/success-view";
import StopDetailModal from "@/components/views/stop-detail-modal";
import SessionDrawer from "@/components/session-drawer";

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
    state: appState,
    itinerary,
    error,
    warnings,
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

  // Progress bar animation (fake progress up to 85% until success)
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

  // Global keyboard navigation (Escape to close modals)
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
    reset();
    setPrompt("");
  };

  // Whether to show the parallax background (not on success view)
  const showBackground = appState === "idle" || appState === "loading" || appState === "streaming" || appState === "error";

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-zinc-950">
      {/* Background: Parallax Scroll + Aurora Glows */}
      {showBackground && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
          <ParallaxScroll images={PARALLAX_IMAGES} autoMove={true} />
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

      {/* View Router */}
      {appState === "idle" && (
        <IdleView
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          onKeyDown={handleKeyDown}
        />
      )}

      {appState === "error" && (
        <ErrorView error={error} onBack={handleBack} onRetry={handleGenerate} />
      )}

      {(appState === "loading" || appState === "streaming") && (
        <LoadingView
          appState={appState}
          progress={progress}
          streamingText={streamingText}
          onCancel={handleBack}
        />
      )}

      {appState === "success" && itinerary && (
        <SuccessView
          itinerary={itinerary}
          warnings={warnings}
          onSave={handleSave}
          onBack={handleBack}
          onReorderStops={reorderStops}
          onRemoveStop={removeStop}
          onSelectStop={setSelectedStop}
          onToggleExpand={toggleDayExpand}
          refinePrompt={refinePrompt}
          setRefinePrompt={setRefinePrompt}
          onRefine={handleRefine}
        />
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
        <StopDetailModal stop={selectedStop} onClose={() => setSelectedStop(null)} />
      )}
    </main>
  );
}
