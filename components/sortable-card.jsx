/* eslint-disable @next/next/no-img-element */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TiltedCard from "@/components/react-bits/tilted-card";
import Magnet from "@/components/react-bits/magnet";
import { Info, Trash2, GripVertical } from "lucide-react";

export function SortableCard({ item, index, setSelectedStop, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const dayNumber = index + 1;
  // Strip hardcoded "Day X:" prefix from AI title so it doesn't conflict with dynamic numbering
  const cleanTitle = item.title.replace(/^Day\s*\d+[:\s-]*/i, '').trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-[1.5rem] overflow-hidden border transition-colors bg-zinc-900 ${
        isDragging ? "border-amber-500 shadow-2xl scale-105" : "border-white/10 hover:border-white/30"
      }`}
    >
      <TiltedCard
        maxTilt={8}
        scaleOnHover={1.02}
        showGlare={true}
        glareColor="rgba(255, 255, 255, 0.18)"
        className="w-full h-[320px] md:h-[400px]"
      >
        <img 
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
          alt={cleanTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none"
        />
        
        {/* Overlay Text content on top of Image */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 bg-gradient-to-t from-black/95 via-black/50 to-black/10">
          {/* Drag Handle Top Right */}
          <div 
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full text-white cursor-grab active:cursor-grabbing transition-colors z-30"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Day Badge */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-wider uppercase border border-white/20 z-30">
            Day {dayNumber}
          </div>

          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{cleanTitle}</h3>
              <p className="text-white/80">{item.subtitle}</p>
            </div>
            <div className="text-right">
              <span className="block text-white/90 font-medium">{item.location}</span>
            </div>
          </div>
          
          {/* Interactive Actions */}
          <div className="flex gap-4 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
            <Magnet padding={50} magnetStrength={3}>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSelectedStop(item)}
                className="bg-white/10 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition-all shadow-lg"
              >
                <Info className="w-5 h-5" />
              </button>
            </Magnet>
            <Magnet padding={50} magnetStrength={3}>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(item.id)}
                className="bg-red-500/80 hover:bg-red-500 backdrop-blur-md p-3 rounded-full text-white transition-all shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </Magnet>
          </div>
        </div>
      </TiltedCard>
    </div>
  );
}
