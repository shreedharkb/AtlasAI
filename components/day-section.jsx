/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { StopCard } from "./stop-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getDestinationImage } from "@/lib/constants";

function useOutsideClick(ref, callback) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      callback(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
}

export default function DaySection({
  day,
  dayIndex,
  onReorderStops,
  onRemoveStop,
  onSelectStop,
  onToggleExpand,
  destination = "",
}) {
  const [active, setActive] = useState(false);
  const ref = useRef(null);
  const id = useId();

  // Find the primary scenic/landmark stop (beach, fort, temple, nature, culture, adventure) so generic cafe/shopping doesn't override the photo
  const primaryStop =
    day.stops.find((s) =>
      /fort|beach|temple|church|cathedral|waterfall|mountain|lake|island|palace|museum|lagoon|hill|cliff|coast|bay/i.test(s.name) ||
      ["nature", "culture", "adventure"].includes(s.category?.toLowerCase())
    ) || day.stops[0];

  const destinationImage = getDestinationImage(
    (primaryStop ? `${primaryStop.name} ${primaryStop.category || ""}` : "") + " " + day.title,
    destination,
    dayIndex
  );

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(false));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active: dndActive, over } = event;
    if (!over || dndActive.id === over.id) return;

    const oldIndex = day.stops.findIndex((s) => s.id === dndActive.id);
    const newIndex = day.stops.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderStops(dayIndex, oldIndex, newIndex);
    }
  };

  return (
    <>
      {/* Aceternity UI Backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md h-full w-full z-50"
          />
        )}
      </AnimatePresence>

      {/* Aceternity UI Expandable Modal */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4 sm:p-6 overflow-y-auto">
            <motion.div
              layoutId={`card-${day.id}-${id}`}
              ref={ref}
              className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-zinc-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl relative my-auto"
            >
              {/* Close Button */}
              <motion.button
                key={`button-close-${day.id}-${id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActive(false)}
                className="absolute top-4 right-4 z-30 p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 rounded-full text-white transition-all shadow-lg"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Modal Hero Banner */}
              <motion.div
                layoutId={`image-${day.id}-${id}`}
                className="relative w-full h-56 sm:h-72 flex-shrink-0 overflow-hidden"
              >
                <img
                  src={destinationImage}
                  alt={day.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1500&q=80";
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-6 left-8 z-10">
                  <span className="font-serif text-amber-300 font-medium text-sm sm:text-base block mb-1 italic">
                    Day {day.dayNumber}
                  </span>
                  <motion.h3
                    layoutId={`title-${day.id}-${id}`}
                    className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-none"
                  >
                    {day.title}
                  </motion.h3>
                </div>
              </motion.div>

              {/* Scrollable Modal Content (Stops List) */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 font-sans">
                  <h4 className="font-serif text-white/80 font-medium text-base">
                    Daily Schedule ({day.stops.length} stops)
                  </h4>
                  <span className="text-xs text-white/40 italic">
                    Drag cards to reorder
                  </span>
                </div>

                {day.stops.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={day.stops.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {day.stops.map((stop, stopIndex) => (
                          <StopCard
                            key={stop.id}
                            stop={stop}
                            dayIndex={dayIndex}
                            stopIndex={stopIndex}
                            onRemove={() => onRemoveStop(dayIndex, stop.id)}
                            onSelect={onSelectStop}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-white/30 text-sm text-center py-8 font-sans">
                    No stops remaining for this day.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Main Page Editorial Card (Aceternity UI closed layout) */}
      <motion.div
        layoutId={`card-${day.id}-${id}`}
        onClick={() => setActive(true)}
        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/20 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl"
      >
        <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
          {/* Thumbnail */}
          <motion.div
            layoutId={`image-${day.id}-${id}`}
            className="flex-shrink-0 overflow-hidden rounded-xl w-20 h-20 sm:w-24 sm:h-24 border border-white/10"
          >
            <img
              src={destinationImage}
              alt={day.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1500&q=80";
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </motion.div>

          {/* Typography Header */}
          <div className="flex-1 min-w-0">
            <span className="font-serif text-sm text-amber-300/90 italic block mb-0.5">
              Day {day.dayNumber}
            </span>
            <motion.h3
              layoutId={`title-${day.id}-${id}`}
              className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors truncate"
            >
              {day.title}
            </motion.h3>
            <p className="font-sans text-xs sm:text-sm text-white/60 mt-1 flex items-center gap-1.5 truncate">
              <span className="text-amber-400 font-bold">✦</span>
              <span className="truncate">
                {day.stops.length > 0
                  ? `Highlight: ${day.stops[0].name}${day.stops.length > 1 ? ` (+ ${day.stops.length - 1} more stops)` : ""}`
                  : "Curated daily itinerary schedule"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold bg-white/10 hover:bg-amber-500 hover:text-zinc-950 text-white border border-white/15 transition-all shadow-sm"
          >
            Explore Day
          </button>
        </div>
      </motion.div>
    </>
  );
}
