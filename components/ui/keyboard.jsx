"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

let audioCtx = null;
let soundBuffer = null;
let configDefines = null;
let isLoadingBuffer = false;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (AudioClass) {
      audioCtx = new AudioClass();
    }
  }
  return audioCtx;
}

// Automatically unlock AudioContext on first user interaction and preload Aceternity UI sound.ogg
if (typeof window !== "undefined") {
  const initAudioAndLoadSprite = async () => {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!configDefines) {
      try {
        const resConfig = await fetch("/sounds/config.json");
        if (resConfig.ok) {
          const cfg = await resConfig.json();
          configDefines = cfg.defines || {};
        }
      } catch (err) {}
    }

    if (!soundBuffer && !isLoadingBuffer && ctx) {
      isLoadingBuffer = true;
      try {
        const resSound = await fetch("/sounds/sound.ogg");
        if (resSound.ok) {
          const arrayBuffer = await resSound.arrayBuffer();
          ctx.decodeAudioData(
            arrayBuffer,
            (decoded) => {
              soundBuffer = decoded;
              isLoadingBuffer = false;
            },
            () => {
              isLoadingBuffer = false;
            }
          );
        } else {
          isLoadingBuffer = false;
        }
      } catch (err) {
        isLoadingBuffer = false;
      }
    }
  };

  window.addEventListener("pointerdown", initAudioAndLoadSprite, { once: true });
  window.addEventListener("click", initAudioAndLoadSprite, { once: true });
  window.addEventListener("keydown", initAudioAndLoadSprite, { once: true });
  // Also initiate fetch right away on load if possible
  setTimeout(initAudioAndLoadSprite, 100);
}

/**
 * High-fidelity Aceternity UI sound.ogg (`CherryMX Black - ABS keycaps`) audio sprite player (`playKeySound`)
 * Exactly matches Aceternity UI Keyboard sound effect as requested without any synthetic oscillator ramps.
 */
export function playKeySound(e) {
  if (typeof window === "undefined") return;

  const key = typeof e === "string" ? e : e?.key || "a";
  if (["Shift", "Control", "Alt", "Meta", "Tab", "CapsLock"].includes(key)) return;

  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  // Pick a sprite offset from Aceternity UI configDefines or fallback to standard keypress offsets in sound.ogg
  let offsetMs = 2894;
  let durationMs = 226;

  if (configDefines && Object.keys(configDefines).length > 0) {
    const keys = Object.keys(configDefines);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const sprite = configDefines[randomKey];
    if (Array.isArray(sprite) && sprite.length >= 2) {
      offsetMs = sprite[0];
      durationMs = sprite[1];
    }
  } else {
    // Built-in offsets from Aceternity UI CherryMX Black sound.ogg if config hasn't parsed yet
    const fallbackOffsets = [
      [2894, 226],
      [12946, 191],
      [13470, 190],
      [13963, 199],
      [14481, 204],
      [14994, 187],
      [15505, 217],
      [15990, 193],
    ];
    const picked = fallbackOffsets[Math.floor(Math.random() * fallbackOffsets.length)];
    offsetMs = picked[0];
    durationMs = picked[1];
  }

  // 1. Play exact audio sprite slice from decoded buffer (`sound.ogg`) via Web Audio API (0ms latency, high volume)
  if (ctx && soundBuffer) {
    try {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = soundBuffer;
      gainNode.gain.value = 1.0; // 100% full volume of recorded sound.ogg

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(ctx.currentTime, offsetMs / 1000, durationMs / 1000);
      return;
    } catch (err) {}
  }

  // 2. Fallback: play exact audio sprite slice using HTMLAudioElement if buffer hasn't decoded yet
  try {
    const audio = new Audio("/sounds/sound.ogg");
    audio.volume = 1.0;
    audio.currentTime = offsetMs / 1000;
    audio.play().catch(() => {});
    setTimeout(() => {
      audio.pause();
    }, durationMs + 20);
  } catch (err) {}
}

const KEYBOARD_ROWS = [
  [
    { label: "`", key: "`", width: "w-10 sm:w-12" },
    { label: "1", key: "1", width: "w-10 sm:w-12" },
    { label: "2", key: "2", width: "w-10 sm:w-12" },
    { label: "3", key: "3", width: "w-10 sm:w-12" },
    { label: "4", key: "4", width: "w-10 sm:w-12" },
    { label: "5", key: "5", width: "w-10 sm:w-12" },
    { label: "6", key: "6", width: "w-10 sm:w-12" },
    { label: "7", key: "7", width: "w-10 sm:w-12" },
    { label: "8", key: "8", width: "w-10 sm:w-12" },
    { label: "9", key: "9", width: "w-10 sm:w-12" },
    { label: "0", key: "0", width: "w-10 sm:w-12" },
    { label: "-", key: "-", width: "w-10 sm:w-12" },
    { label: "=", key: "=", width: "w-10 sm:w-12" },
    { label: "Backspace", key: "Backspace", width: "w-16 sm:w-24" },
  ],
  [
    { label: "Tab", key: "Tab", width: "w-14 sm:w-18" },
    { label: "Q", key: "q", width: "w-10 sm:w-12" },
    { label: "W", key: "w", width: "w-10 sm:w-12" },
    { label: "E", key: "e", width: "w-10 sm:w-12" },
    { label: "R", key: "r", width: "w-10 sm:w-12" },
    { label: "T", key: "t", width: "w-10 sm:w-12" },
    { label: "Y", key: "y", width: "w-10 sm:w-12" },
    { label: "U", key: "u", width: "w-10 sm:w-12" },
    { label: "I", key: "i", width: "w-10 sm:w-12" },
    { label: "O", key: "o", width: "w-10 sm:w-12" },
    { label: "P", key: "p", width: "w-10 sm:w-12" },
    { label: "[", key: "[", width: "w-10 sm:w-12" },
    { label: "]", key: "]", width: "w-10 sm:w-12" },
    { label: "\\", key: "\\", width: "w-12 sm:w-16" },
  ],
  [
    { label: "Caps Lock", key: "CapsLock", width: "w-16 sm:w-22" },
    { label: "A", key: "a", width: "w-10 sm:w-12" },
    { label: "S", key: "s", width: "w-10 sm:w-12" },
    { label: "D", key: "d", width: "w-10 sm:w-12" },
    { label: "F", key: "f", width: "w-10 sm:w-12" },
    { label: "G", key: "g", width: "w-10 sm:w-12" },
    { label: "H", key: "h", width: "w-10 sm:w-12" },
    { label: "J", key: "j", width: "w-10 sm:w-12" },
    { label: "K", key: "k", width: "w-10 sm:w-12" },
    { label: "L", key: "l", width: "w-10 sm:w-12" },
    { label: ";", key: ";", width: "w-10 sm:w-12" },
    { label: "'", key: "'", width: "w-10 sm:w-12" },
    { label: "Enter", key: "Enter", width: "w-16 sm:w-24" },
  ],
  [
    { label: "Shift", key: "Shift", width: "w-20 sm:w-28" },
    { label: "Z", key: "z", width: "w-10 sm:w-12" },
    { label: "X", key: "x", width: "w-10 sm:w-12" },
    { label: "C", key: "c", width: "w-10 sm:w-12" },
    { label: "V", key: "v", width: "w-10 sm:w-12" },
    { label: "B", key: "b", width: "w-10 sm:w-12" },
    { label: "N", key: "n", width: "w-10 sm:w-12" },
    { label: "M", key: "m", width: "w-10 sm:w-12" },
    { label: ",", key: ",", width: "w-10 sm:w-12" },
    { label: ".", key: ".", width: "w-10 sm:w-12" },
    { label: "/", key: "/", width: "w-10 sm:w-12" },
    { label: "Shift", key: "ShiftRight", width: "w-20 sm:w-28" },
  ],
  [
    { label: "Ctrl", key: "Control", width: "w-14 sm:w-16" },
    { label: "Alt", key: "Alt", width: "w-12 sm:w-14" },
    { label: "Cmd", key: "Meta", width: "w-14 sm:w-16" },
    { label: "Space", key: " ", width: "w-48 sm:w-64" },
    { label: "Cmd", key: "MetaRight", width: "w-14 sm:w-16" },
    { label: "Alt", key: "AltRight", width: "w-12 sm:w-14" },
    { label: "Ctrl", key: "ControlRight", width: "w-14 sm:w-16" },
  ],
];

export function Keyboard({ enableSound = true, className }) {
  const [activeKeys, setActiveKeys] = useState(new Set());

  const handleKeyDown = useCallback(
    (e) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        next.add(e.key);
        return next;
      });

      if (enableSound && !["shift", "control", "alt", "meta"].includes(key)) {
        playKeySound(e);
      }
    },
    [enableSound]
  );

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      next.delete(e.key);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className={cn("p-4 rounded-3xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-xl max-w-4xl mx-auto shadow-2xl", className)}>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5 sm:gap-2">
            {row.map((item) => {
              const isActive = activeKeys.has(item.key.toLowerCase()) || activeKeys.has(item.key);
              return (
                <button
                  key={item.label}
                  type="button"
                  onPointerDown={() => {
                    if (enableSound) playKeySound(item.key);
                  }}
                  className={cn(
                    "h-10 sm:h-12 flex items-center justify-center rounded-xl font-medium text-xs sm:text-sm border transition-all select-none",
                    item.width,
                    isActive
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-95 translate-y-0.5"
                      : "bg-zinc-900 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800/80 hover:text-white shadow-[0_4px_0_rgba(39,39,42,0.8)] active:translate-y-0.5 active:shadow-none"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
