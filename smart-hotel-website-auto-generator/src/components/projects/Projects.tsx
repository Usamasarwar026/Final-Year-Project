"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import Navbar from "@/components/navbar/Navbar";

type Project = {
  id: string;
  name: string;
  modules: string[];
  tier: string;
  status: "GENERATING" | "DONE" | "FAILED";
  createdAt: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/projects")
      .then((res) => setProjects(res.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (status: Project["status"]) => {
    if (status === "DONE")
      return "bg-green-500/10 text-green-600 border-green-500/20";
    if (status === "FAILED")
      return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">My Projects</h1>

        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading
            projects...
          </div>
        )}

        {!loading && projects.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            No projects found.
          </p>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground text-sm">
                    {p.name}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(
                      p.status,
                    )}`}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  Tier:{" "}
                  <span className="font-semibold text-foreground">
                    {p.tier}
                  </span>
                </p>

                <p className="text-[11px] text-muted-foreground mb-2">
                  Created: {new Date(p.createdAt).toLocaleString()}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {p.modules.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border text-foreground/70"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
