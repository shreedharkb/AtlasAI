"use client";

import { useEffect, useRef } from "react";
import { X, Trash2, Clock, Download, Upload } from "lucide-react";

/**
 * Slide-in drawer showing previously saved trip sessions.
 * Sessions are loaded from localStorage via the useLocalStorage hook.
 * Supports keyboard navigation (Escape to close) and JSON Export/Import of saved trips.
 */
export default function SessionDrawer({ sessions = [], onLoad, onDelete, onImport, onClose }) {
  const fileInputRef = useRef(null);

  // Keyboard navigation: Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleExportSession = (e, session) => {
    e.stopPropagation();
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${session.title || "trip"}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export trip", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (onImport) {
          const newId = onImport(json);
          if (newId && onLoad) {
            onLoad(newId);
          }
        }
      } catch (err) {
        console.error("Invalid trip JSON file", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-label="Previous trips"
    >
      <div
        className="w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-serif font-bold text-white tracking-tight">Previous Trips</h2>
            <span className="text-xs text-white/50 font-serif italic">
              ({sessions.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Import saved trip JSON"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Import
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Close drawer (Esc)"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-8 text-center my-auto py-20">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-white/60 font-serif font-medium text-base">No saved trips yet</p>
              <p className="text-white/40 text-xs sm:text-sm mt-1 max-w-xs mx-auto leading-relaxed">
                Generate a trip and click &quot;Save&quot; to see it here, or import a trip JSON file.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="relative group p-4 rounded-2xl border border-white/5 hover:border-white/15 bg-white/[0.03] hover:bg-white/[0.07] transition-all"
                >
                  <button
                    onClick={() => onLoad(session.id)}
                    className="w-full text-left pr-16 block focus:outline-none"
                  >
                    <h3 className="text-white font-medium truncate text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                      {session.title || "Untitled Trip"}
                    </h3>
                    <p className="text-white/40 text-xs sm:text-sm truncate mt-1">
                      {session.prompt}
                    </p>
                    <div className="flex items-center gap-1.5 text-white/30 text-xs mt-2.5 font-mono">
                      <Clock className="w-3 h-3 text-amber-400/60" />
                      {new Date(session.savedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </button>

                  {/* Actions right corner */}
                  <div className="absolute top-4 right-3 flex items-center gap-1">
                    <button
                      onClick={(e) => handleExportSession(e, session)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-amber-300 hover:bg-white/5 transition-all"
                      title="Export trip JSON"
                      aria-label={`Export ${session.title}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-all"
                      title="Delete saved trip"
                      aria-label={`Delete ${session.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
