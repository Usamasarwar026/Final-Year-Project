"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Eye, Edit3, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStaff, useAttendance } from "@/hooks/useStaff";
import type { StaffUser } from "@/types/staff";

export default function StaffDetailPanel({ staff, onClose, onUpdate }: {
  staff: StaffUser;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { updateStaff } = useStaff();
  const { logs, markAttendance } = useAttendance(staff.staffProfile?.staff_id);

  const [activeTab, setActiveTab] = useState<"info" | "attendance" | "notes">("info");
  const [notes, setNotes] = useState(staff.staffProfile?.performance_notes || "");
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    const res = await updateStaff(staff.id, { performance_notes: notes });
    setSaving(false);
    if (res.ok) {
      toast.success("Notes updated");
      onUpdate();
    } else toast.error("Failed to save notes");
  };

  const attSummary = useMemo(() => ({
    present: logs.filter(l => l.status === "Present").length,
    absent: logs.filter(l => l.status === "Absent").length,
    // ... other statuses
  }), [logs]);

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l shadow-2xl z-[200] overflow-auto">
      
      <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-background">
        <h2 className="font-semibold">Staff Details</h2>
        <button onClick={onClose}><X size={20} /></button>
      </div>

      {/* Profile Header */}
      <div className="p-5 border-b">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {staff.name.split(" ").map(n => n[0]).join("").toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{staff.name}</h3>
            <p className="text-sm text-muted-foreground">{staff.staffProfile?.designation}</p>
            <p className="text-xs font-mono">{staff.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-5">
        {["info", "attendance", "notes"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === "info" && <div>Info Tab Content...</div>}
        {activeTab === "attendance" && <div>Attendance Logs...</div>}
        {activeTab === "notes" && (
          <div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-40 p-3 border rounded-xl" placeholder="Performance notes..." />
            <button onClick={saveNotes} disabled={saving} className="mt-3 px-5 py-2 bg-primary text-white rounded-xl">
              {saving ? "Saving..." : "Save Notes"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}