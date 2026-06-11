// app/api/rooms/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/rooms/upload
// Body: FormData with field "file"
// Returns: { url: "/uploads/rooms/filename.jpg" }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "STAFF")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP images are allowed" },
        { status: 400 }
      );

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Unique filename
    const ext      = path.extname(file.name) || ".jpg";
    const filename = `room_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "rooms");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/rooms/${filename}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}