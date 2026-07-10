"use client";

import { X, Trash2, Clock } from "lucide-react";

/**
 * Slide-in drawer showing previously saved trip sessions.
 * Sessions are loaded from localStorage via the useLocalStorage hook.
 */
export default function SessionDrawer({ sessions, onLoad, onDelete, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Previous trips"
    >
      <div
        className="w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-xl z-10">
          <h2 className="text-xl font-bold text-white">Previous Trips</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-white/40 font-medium">No saved trips yet.</p>
            <p className="text-white/25 text-sm mt-1">
              Generate a trip and click &quot;Save&quot; to see it here.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="relative group p-4 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.03] hover:bg-white/[0.07] transition-all"
              >
                <button
                  onClick={() => onLoad(session.id)}
                  className="w-full text-left pr-8"
                >
                  <h3 className="text-white font-medium truncate text-sm sm:text-base">
                    {session.title}
                  </h3>
                  <p className="text-white/40 text-sm truncate mt-1">
                    {session.prompt}
                  </p>
                  <div className="flex items-center gap-1 text-white/25 text-xs mt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(session.savedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </button>

                {/* Delete — always visible on mobile, hover on desktop */}
                <button
                  onClick={() => onDelete(session.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-white/20 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
