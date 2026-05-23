// components/profile/AvatarUpload.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadProfileImage, useUpdateProfile } from "@/hooks/useProfile";
import clsx from "clsx";

type Props = {
  currentImage: string | null;
  name: string;
};

export default function AvatarUpload({ currentImage, name }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage  = useUploadProfileImage();
  const updateProfile = useUpdateProfile();

  const isLoading = uploadImage.isPending || updateProfile.isPending;

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const handleFile = async (file: File) => {
    setError(null);

    // Client-side validation
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Only JPG, PNG, WEBP or GIF files allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    // Show local preview instantly
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      // Upload to cloudinary
      const { url } = await uploadImage.mutateAsync(file);
      // Save URL to DB
      await updateProfile.mutateAsync({ profileImage: url });
    } catch {
      setPreview(null);
      setError("Upload failed. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const displayImage = preview || currentImage;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div
        className={clsx(
          "relative group cursor-pointer select-none",
          "w-28 h-28 rounded-full",
          dragOver && "scale-105"
        )}
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload profile picture"
      >
        {/* Image or initials */}
        <div className={clsx(
          "w-28 h-28 rounded-full overflow-hidden",
          "ring-4 ring-background shadow-elegant",
          "transition-all duration-200",
          dragOver ? "ring-accent" : "ring-background"
        )}>
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              width={112}
              height={112}
              className="w-full h-full object-cover"
              unoptimized={!!preview} // local blob doesn't need Next optimization
            />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <span className="text-white text-3xl font-semibold">{initials}</span>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className={clsx(
          "absolute inset-0 rounded-full",
          "bg-black/50 flex flex-col items-center justify-center gap-1",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isLoading && "opacity-100"
        )}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 size={22} className="text-white animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Camera size={20} className="text-white" />
                <span className="text-white text-[10px] font-medium">Change</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Helper text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Click or drag to upload · JPG, PNG, WEBP, GIF · Max 5MB
        </p>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-500 mt-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}