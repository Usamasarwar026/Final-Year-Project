// src/app/api/profile/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/database/db";

// Cloudinary configuration with validation
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Check if Cloudinary is configured
const isCloudinaryConfigured = cloudName && apiKey && apiSecret;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log("✅ Cloudinary configured successfully");
} else {
  console.warn("⚠️ Cloudinary not configured. Image upload will use local storage fallback.");
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const VALID_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Local file storage fallback (if Cloudinary not configured)
async function saveLocalImage(buffer: Buffer, userId: string, fileType: string) {
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  
  const ext = fileType.split("/")[1];
  const filename = `${userId}_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
  
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);
  
  return `/uploads/profiles/${filename}`;
}

// ── POST /api/profile/upload-image ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!VALID_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP or GIF allowed" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large — max 5MB" },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let imageUrl: string;

    // Upload to Cloudinary or local storage
    if (isCloudinaryConfigured) {
      try {
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: "profile-images",
          public_id: `user-${userId}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        });
        imageUrl = result.secure_url;
      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
        imageUrl = await saveLocalImage(buffer, userId, file.type);
      }
    } else {
      // Fallback to local storage
      imageUrl = await saveLocalImage(buffer, userId, file.type);
    }

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl },
    });

    return NextResponse.json({ url: imageUrl });
  } catch (err: any) {
    console.error("[POST /api/profile/upload-image] Detailed error:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}