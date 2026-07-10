"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as LucideIcons from "lucide-react";
import Magnet from "@/components/react-bits/magnet";
import { CATEGORIES } from "@/lib/constants";

export function StopCard({ stop, onRemove, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.95 : 1,
  };

  const cat = CATEGORIES[stop.category] || CATEGORIES.other;
  const IconComponent = LucideIcons[cat.iconName] || LucideIcons.MapPin;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(stop)}
      className={`group relative flex items-center justify-between gap-4 py-4 px-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
        isDragging
          ? "border-white/40 bg-zinc-800/95 shadow-2xl scale-[1.02] z-50"
          : "border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/20 hover:shadow-lg"
      }`}
    >
      {/* Left & Middle Content */}
      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
        {/* Subtle Drag Handle */}
        <button
          className="flex-shrink-0 mt-1 sm:mt-0 p-1.5 text-white/25 hover:text-white/70 cursor-grab active:cursor-grabbing transition-colors touch-manipulation"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          aria-label="Drag to reorder stop"
        >
          <LucideIcons.GripVertical className="w-4 h-4" />
        </button>

        {/* Minimalist Magnet Category Circle */}
        <div className="flex-shrink-0 mt-0.5 sm:mt-0" title={cat.label}>
          <Magnet padding={20} magnetStrength={3}>
            <div className="p-3 rounded-full bg-white/5 border border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white transition-all shadow-sm">
              <IconComponent className="w-4 h-4" />
            </div>
          </Magnet>
        </div>

        {/* Clean Editorial Typography (Serif Title + Sans Body) */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
            <h4 className="font-serif text-lg sm:text-xl font-medium text-white tracking-tight group-hover:text-emerald-300 transition-colors truncate">
              {stop.name}
            </h4>
            
            {/* Minimalist Time & Duration (No bulky colored pills) */}
            {(stop.time || stop.duration) && (
              <span className="font-sans text-xs sm:text-sm text-white/50 tracking-wide flex-shrink-0">
                {stop.time} {stop.duration ? `· ${stop.duration}` : ""}
              </span>
            )}
          </div>

          {/* Clean 2-line Description without unnecessary extra badges */}
          {stop.description && (
            <p className="font-sans text-xs sm:text-sm text-white/65 leading-relaxed line-clamp-2">
              {stop.description}
            </p>
          )}
        </div>
      </div>

      {/* Minimalist Circular Actions */}
      <div
        className="flex items-center gap-2 flex-shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Magnet padding={15} magnetStrength={3}>
          <button
            onClick={() => onSelect(stop)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
            title="View details"
            aria-label={`View details for ${stop.name}`}
          >
            <LucideIcons.Info className="w-4 h-4" />
          </button>
        </Magnet>

        <Magnet padding={15} magnetStrength={3}>
          <button
            onClick={() => onRemove(stop.id)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            title="Remove stop"
            aria-label={`Remove ${stop.name}`}
          >
            <LucideIcons.Trash2 className="w-4 h-4" />
          </button>
        </Magnet>
      </div>
    </div>
  );
}
