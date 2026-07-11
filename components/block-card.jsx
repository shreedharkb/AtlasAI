"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { resolveBlockIcon } from "@/lib/iconResolver";
import TiltedCard from "@/components/react-bits/tilted-card";

/**
 * Renders a clean, editorial expense summary table
 */
const CHART_COLORS = [
  "bg-amber-400 border-amber-300",
  "bg-emerald-400 border-emerald-300",
  "bg-sky-400 border-sky-300",
  "bg-rose-400 border-rose-300",
  "bg-purple-400 border-purple-300",
  "bg-teal-400 border-teal-300",
];

/**
 * Renders an interactive visual chart & expense summary breakdown (`chart` / `budget` block)
 */
function BudgetBlock({ block }) {
  const items = block.items || [];
  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0) || 1;
  const currency = items[0]?.currency || "USD";

  return (
    <div className="space-y-5">
      {/* Visual Stacked Bar Chart */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="h-3.5 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden flex gap-0.5 p-0.5">
            {items.map((item, i) => {
              const pct = Math.max(2, Math.round(((item.amount || 0) / total) * 100));
              const colorClass = CHART_COLORS[i % CHART_COLORS.length].split(" ")[0];
              return (
                <div
                  key={i}
                  className={`h-full rounded-sm transition-all duration-700 ${colorClass}`}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${pct}%`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] font-sans text-white/50 px-1">
            <span>Cost Distribution Chart</span>
            <span>100% Total</span>
          </div>
        </div>
      )}

      {/* Breakdown List with Individual Mini Progress Bars */}
      <div className="divide-y divide-white/5">
        {items.map((item, i) => {
          const pct = Math.round(((item.amount || 0) / total) * 100);
          const colorClass = CHART_COLORS[i % CHART_COLORS.length].split(" ")[0];
          return (
            <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5 font-sans">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorClass} flex-shrink-0`} />
                  <span className="text-sm text-white/85 font-normal">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs text-white/45 font-mono">{pct}%</span>
                  <span className="text-sm font-mono font-medium text-amber-400/90">
                    {item.currency || currency} {(item.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorClass} opacity-75 transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Total Footer */}
      <div className="pt-3.5 mt-2 border-t border-white/10 flex items-baseline justify-between font-sans">
        <span className="text-xs uppercase tracking-widest font-semibold text-white/50">
          Total (per day)
        </span>
        <span className="text-lg sm:text-xl font-serif font-bold text-amber-300">
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
            onClick={() => toggleItem(i)}
            className="group flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5 select-none"
          >
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                checked.has(i)
                  ? "bg-amber-500 border-amber-400 text-zinc-950 shadow-sm shadow-amber-500/20"
                  : "border-white/20 bg-white/[0.02] group-hover:border-white/40"
              }`}
            >
              {checked.has(i) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders refined, editorial travel guide callouts inside side-by-side card (`card` / `tips` block)
 */
function TipsBlock({ block }) {
  return (
    <div className="divide-y divide-white/5 pt-1">
      {block.items.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 items-start py-3 first:pt-1 last:pb-1"
        >
          <span className="font-serif text-base sm:text-lg font-semibold text-amber-300/80 flex-shrink-0 pt-0.5">
            {(i + 1).toString().padStart(2, "0")}.
          </span>
          <p className="font-sans text-white/80 text-xs sm:text-sm leading-relaxed">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

const BLOCK_ICONS = {
  budget: "BarChart3",
  chart: "BarChart3",
  checklist: "CheckSquare",
  tips: "Lightbulb",
  card: "Bookmark",
};

/**
 * Renders high-end, editorial side blocks (`card`, `chart`, `checklist`)
 */
export default function BlockCard({ block }) {
  const iconName = BLOCK_ICONS[block.type] || "FileText";
  const IconComponent = resolveBlockIcon(iconName);

  const isChart = block.type === "budget" || block.type === "chart";
  const isChecklist = block.type === "checklist";
  const isCard = block.type === "tips" || block.type === "card";

  return (
    <TiltedCard
      maxTilt={6}
      scaleOnHover={1.01}
      showGlare={true}
      glareColor="rgba(255, 255, 255, 0.12)"
      className="w-full h-full rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 text-amber-300 flex-shrink-0 shadow-sm">
            <IconComponent className="w-5 h-5" />
          </span>
          <h4 className="font-serif text-lg sm:text-xl font-medium text-white tracking-tight">
            {block.title || (isChart ? "Cost Distribution Chart" : isChecklist ? "Checklist" : "Guide Card")}
          </h4>
        </div>
      </div>

      {isChart && <BudgetBlock block={block} />}
      {isChecklist && <ChecklistBlock block={block} />}
      {(isCard || (!isChart && !isChecklist)) && <TipsBlock block={block} />}
    </TiltedCard>
  );
}
