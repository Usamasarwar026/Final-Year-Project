"use client";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel} />
          <motion.div
            className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
            <div className="flex gap-2.5 mt-5">
              <button onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors">
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}