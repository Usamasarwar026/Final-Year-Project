"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "../footer/Footer";
import { Button } from "../button/Button";
import {
  WebsiteName,
  IMAGES,
  STATUS_CONFIG,
  type Room,
} from "@/constant/constant";
import { clsx } from "clsx";
import api from "@/lib/axios";

// ── fetcher ──────────────────────────────────────────────
async function fetchPublicRooms(): Promise<Room[]> {
  const { data } = await api.get<{ rooms: Room[] }>("/rooms/public");
  return data.rooms ?? [];
}

// ── component ────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [visibleCount, setVisibleCount] = useState(9);

  // TanStack Query — replaces useEffect + useState(loading/rooms)
  const {
    data: rooms = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["publicRooms"],
    queryFn: fetchPublicRooms,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  if (isError) {
    return <div className="text-center py-20">Failed to load rooms.</div>;
  }

  // ── handlers ──────────────────────────────────────────
  const handleBookNow = async () => {
    const res = await signIn("credentials", { redirect: false });
    if (!res?.ok) {
      router.push("/login");
      return;
    }
    router.push("/customer/booking");
  };

  const handleRoomBook = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    router.push("/customer/booking");
  };

  const handleShowMore = () => setVisibleCount((prev) => prev + 6);
  const handleShowLess = () => setVisibleCount(9);

  const visibleRooms = rooms.slice(0, visibleCount);

  // ── render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navbar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-primary/10 backdrop-blur-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 text-white">
          <Link href="/" className="font-serif text-xl text-gold">
            {WebsiteName}
          </Link>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="border border-white px-6 py-1 rounded-md text-sm hover:bg-gold hover:text-black"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-gold text-black px-6 py-1 rounded-md text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <Image
            src={IMAGES.heroImage}
            alt="Luxury Hotel"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-4"
        >
          <h1 className="font-serif text-5xl md:text-7xl">
            Luxury Stays Redefined
          </h1>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Book rooms, dine, and manage your stay in one seamless experience.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleBookNow}
              className="bg-gold text-black px-6 py-3 rounded-lg font-semibold"
            >
              Book Now
            </button>
            <Link
              href="#rooms"
              className="border border-white px-6 py-3 rounded-lg"
            >
              Explore Rooms
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ROOMS SECTION */}
      <section id="rooms" className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-serif text-primary mb-10">
          Featured Rooms
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading rooms…</p>
          </div>
        ) : (
          <>
            {rooms.length === 0 ? (
              <div className="py-20 text-center">
                <h3 className="text-2xl font-semibold">No Rooms Available</h3>

                <p className="mt-2 text-muted-foreground">
                  There are currently no rooms available. Please check again
                  later.
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  {visibleRooms.map((room, i) => {
                    const statusConfig = STATUS_CONFIG[room.status];
                    const roomImage =
                      room.photos?.[0] || "/assets/room-standard.jpg";

                    return (
                      <motion.div
                        key={room.room_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        className="bg-card rounded-xl overflow-hidden shadow-lg flex flex-col"
                      >
                        <div className="relative h-56 w-full">
                          <Image
                            src={roomImage}
                            alt={`Room ${room.room_number}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />

                          <div className="absolute top-3 right-3">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                                statusConfig.bg,
                                statusConfig.text,
                              )}
                            >
                              <span
                                className={clsx(
                                  "w-1.5 h-1.5 rounded-full",
                                  statusConfig.dot,
                                )}
                              />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-serif text-xl">
                            Room {room.room_number}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {room.room_type}
                          </p>

                          <p className="text-lg font-bold text-primary mt-2">
                            PKR {Number(room.price_per_night).toFixed(0)}/night
                          </p>

                          <button
                            onClick={handleRoomBook}
                            className="mt-4 bg-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-gold/90 transition-colors"
                          >
                            Book Now
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {rooms.length > 9 && (
                  <div className="flex justify-center gap-4 mt-10">
                    {visibleCount < rooms.length && (
                      <button
                        onClick={handleShowMore}
                        className="border border-primary px-6 py-2 rounded-lg text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Show More
                      </button>
                    )}

                    {visibleCount > 9 && (
                      <button
                        onClick={handleShowLess}
                        className="border border-muted-foreground px-6 py-2 rounded-lg text-muted-foreground font-semibold hover:bg-muted transition-colors"
                      >
                        Show Less
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="bg-hero text-primary-foreground py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">
            Reserve
          </span>
          <h2 className="mt-3 font-serif text-4xl md:text-6xl">
            Your stay begins here.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Create an account to book, order in-room dining, and manage your
            stay end-to-end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gold text-primary hover:bg-gold/90"
            >
              <Link href="/signup">Create account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-primary-foreground bg-transparent hover:bg-white/10 hover:text-gold"
            >
              <Link href="#rooms">Browse rooms</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
