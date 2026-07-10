"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * PixelCard - A high-resolution card wrapper that clubs together content and pixel image banners
 * with a subtle interactive spotlight/pixel edge effect.
 */
export default function PixelCard({
  children,
  className,
  spotlightColor = "rgba(52, 211, 153, 0.15)",
  borderGlowColor = "rgba(255, 255, 255, 0.18)",
  ...props
}) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(0.6);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-3xl border border-white/15 bg-zinc-900/80 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 hover:border-white/25",
        className
      )}
      {...props}
    >
      {/* Interactive Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 z-30 rounded-[inherit]"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Subtle Pixel Border Dots Accent on Top Corner */}
      <div className="absolute top-3 right-3 z-30 pointer-events-none flex gap-1 opacity-40">
        <div className="w-1.5 h-1.5 rounded-none bg-amber-400 animate-pulse" />
        <div className="w-1.5 h-1.5 rounded-none bg-white/40" />
        <div className="w-1.5 h-1.5 rounded-none bg-white/20" />
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
