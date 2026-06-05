// src/app/api/generate/route.ts  (GENERATOR project)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/lib/prisma";
import { buildProjectZip } from "@/lib/generator/buildProject";
import type { ModuleId } from "@/lib/generator/moduleFiles";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { websiteName, modules } = body as {
    websiteName: string;
    modules: ModuleId[];
  };

  // Validate
  if (!websiteName?.trim()) {
    return NextResponse.json(
      { error: "Website name is required" },
      { status: 400 },
    );
  }
  if (!Array.isArray(modules) || modules.length === 0) {
    return NextResponse.json(
      { error: "At least one module required" },
      { status: 400 },
    );
  }

  const userId = (session.user as any).id as string;

  // Save project record as GENERATING
  const project = await prisma.project.create({
    data: {
      name: websiteName.trim(),
      modules: modules,
      status: "GENERATING",
      userId,
    },
  });

  try {
    // Build ZIP
    const zipBuffer = await buildProjectZip({
      websiteName: websiteName.trim(),
      modules,
    });

    // Mark as DONE
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "DONE" },
    });

    // Return ZIP as download
    const slug = websiteName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}.zip"`,
        "X-Project-Id": project.id,
      },
    });
  } catch (err) {
    console.error("[generate]", err);

    await prisma.project.update({
      where: { id: project.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 },
    );
  }
}
