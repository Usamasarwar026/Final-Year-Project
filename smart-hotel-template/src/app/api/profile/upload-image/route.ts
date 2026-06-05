// src/app/api/profile/upload-image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/database/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Type validation
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP or GIF allowed" },
      { status: 400 }
    );
  }

  // Size validation — 5MB max
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Max size is 5MB" },
      { status: 400 }
    );
  }

  // File → base64 for Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64  = `data:${file.type};base64,${buffer.toString("base64")}`;

  const userId = (session.user as any).id as string;

  // Upload to Cloudinary
  // Same public_id = old image auto replace ho jata hai
  const result = await cloudinary.uploader.upload(base64, {
    folder:      "profile-images",
    public_id:   `user-${userId}`,
    overwrite:   true,
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  // DB mein bhi save karo
  await prisma.user.update({
    where: { id: userId },
    data:  { profileImage: result.secure_url },
  });

  return NextResponse.json({ url: result.secure_url });
}