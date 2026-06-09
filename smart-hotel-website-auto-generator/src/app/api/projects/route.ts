// src/app/api/projects/route.ts (with fallback)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      modules: true,
      tier: true,
      status: true,
      createdAt: true,
    },
  });

  // Old projects ke liye fallback tier
  const projectsWithTier = projects.map(project => ({
    ...project,
    tier: project.tier || "advanced", // fallback for old projects
  }));

  return NextResponse.json(projectsWithTier);
}