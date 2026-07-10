"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import TiltedCard from "@/components/react-bits/tilted-card";

/**
 * Renders a clean, editorial expense summary table
 */
function BudgetBlock({ block }) {
  const total = block.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const currency = block.items[0]?.currency || "USD";

  return (
    <div className="space-y-1">
      <div className="divide-y divide-white/5">
        {block.items.map((item, i) => (
          <div key={i} className="flex items-baseline justify-between py-2.5 font-sans">
            <span className="text-sm text-white/75 font-normal">{item.label}</span>
            <span className="text-sm font-mono font-medium text-emerald-400/90">
              {item.currency || currency} {(item.amount || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      
      <div className="pt-4 mt-2 border-t border-white/10 flex items-baseline justify-between font-sans">
        <span className="text-xs uppercase tracking-widest font-semibold text-white/50">
          Total (per day)
        </span>
        <span className="text-lg sm:text-xl font-serif font-bold text-emerald-300">
          {currency} {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/**
 * Renders an interactive, refined packing checklist
 */
function ChecklistBlock({ block }) {
  const [checked, setChecked] = useState(new Set());

  const toggleItem = (idx) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const progress = block.items.length > 0 ? (checked.size / block.items.length) * 100 : 0;

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-1.5">
        {block.items.map((item, i) => (
          <label
            key={i}
            className="group flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5 select-none"
          >
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                checked.has(i)
                  ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/20"
                  : "border-white/20 bg-white/[0.02] group-hover:border-white/40"
              }`}
            >
              {checked.has(i) && <LucideIcons.Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span
              className={`font-sans text-sm leading-snug transition-all ${
                checked.has(i)
                  ? "text-white/35 line-through decoration-white/20"
                  : "text-white/80 group-hover:text-white"
              }`}
            >
              {item}
            </span>
          </label>
        ))}
      </div>

      <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between font-sans">
        <span className="text-xs text-white/40 font-medium">
          {checked.size} of {block.items.length} packed
        </span>
        <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders refined, editorial travel guide callouts inside side-by-side card
 */
function TipsBlock({ block }) {
  return (
    <div className="divide-y divide-white/5 pt-1">
      {block.items.map((item, i) => (
        <div
          key={i}
          className="flex gap-3.5 items-start py-3 first:pt-1 last:pb-1"
        >
          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex-shrink-0 border border-emerald-500/20">
            {(i + 1).toString().padStart(2, "0")}
          </span>
          <p className="font-sans text-white/75 text-xs sm:text-sm leading-relaxed">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

const BLOCK_ICONS = {
  budget: "CircleDollarSign",
  checklist: "CheckSquare",
  tips: "Lightbulb",
};

/**
 * Renders high-end, editorial side blocks
 */
export default function BlockCard({ block }) {
  const iconName = BLOCK_ICONS[block.type] || "FileText";
  const IconComponent = LucideIcons[iconName] || LucideIcons.FileText;

  return (
    <TiltedCard
      maxTilt={6}
      scaleOnHover={1.01}
      showGlare={true}
      glareColor="rgba(255, 255, 255, 0.12)"
      className="w-full rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
        <span className="p-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 flex-shrink-0">
          <IconComponent className="w-4 h-4" />
        </span>
        <h4 className="font-serif text-lg sm:text-xl font-medium text-white tracking-tight">
          {block.title}
        </h4>
      </div>

      {block.type === "budget" && <BudgetBlock block={block} />}
      {block.type === "checklist" && <ChecklistBlock block={block} />}
      {block.type === "tips" && <TipsBlock block={block} />}
    </TiltedCard>
  );
}
