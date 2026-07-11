"use client";

import { X } from "lucide-react";
import SpotlightCard from "@/components/react-bits/spotlight-card";
import { BorderBeam } from "@/components/magicui/border-beam";
import { PixelImage } from "@/components/magicui/pixel-image";
import { CATEGORIES, getDestinationImage } from "@/lib/constants";
import { resolveIcon } from "@/lib/iconResolver";

/**
 * Modal overlay showing full details for a single stop (time, duration, tips, image).
 */
export default function StopDetailModal({ stop, onClose }) {
  if (!stop) return null;

  const cat = CATEGORIES[stop.category] || CATEGORIES.other;
  const Icon = resolveIcon(cat.iconName);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <SpotlightCard
        spotlightColor="rgba(99, 102, 241, 0.2)"
        className="relative w-full max-w-xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <BorderBeam colorFrom="#34d399" colorTo="#a855f7" duration={4} size={80} borderWidth={1.5} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/90 backdrop-blur-md p-2 rounded-full text-white/80 hover:text-white transition-all border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* High Resolution PixelImage Stop Header */}
        <div className="w-full h-52 relative border-b border-white/10 overflow-hidden">
          <PixelImage
            src={getDestinationImage(stop.name + " " + (stop.description || "") + " " + stop.category)}
            customGrid={{ rows: 4, cols: 6 }}
            grayscaleAnimation={true}
            className="w-full h-full rounded-t-3xl rounded-b-none"
          />
        </div>

        <div className="p-8 pt-6">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 text-amber-300 shadow-sm flex-shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">{stop.name}</h2>
          </div>
          <div className="flex gap-4 mb-6 text-sm text-amber-300/90 font-mono">
            {stop.time && <span>🕒 {stop.time}</span>}
            {stop.duration && <span>⌛ {stop.duration}</span>}
          </div>
          <div className="text-white/85 leading-relaxed text-base sm:text-lg font-sans border-l-2 border-amber-400/50 pl-4 mb-6">
            <p>{stop.description || "No description provided."}</p>
          </div>
          {stop.tips && (
            <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <h4 className="font-serif text-amber-300 font-medium mb-2 flex items-center gap-2 text-base">
                ✦ Insider Tip
              </h4>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed font-sans">{stop.tips}</p>
            </div>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
}
