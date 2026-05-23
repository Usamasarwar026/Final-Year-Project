"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Footer } from "../footer/Footer";
import { Button } from "../button/Button";
import { WebsiteName } from "@/constant/constant";

const heroImg = "/assets/hero-hotel.jpg";
const deluxeImg = "/assets/room-deluxe.jpg";
const suiteImg = "/assets/room-suite.jpg";
const standardImg = "/assets/room-standard.jpg";

const rooms = [
  {
    name: "Deluxe",
    img: deluxeImg,
  },
  {
    name: "Suite",
    img: suiteImg,
  },
  {
    name: "Standard",
    img: standardImg,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const handleBookNow = async () => {
    const res = await signIn("credentials", {
      redirect: false,
    });

    if (!res?.ok) {
      router.push("/login");
      return;
    }

    router.push("/rooms");
  };

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

          <div className="flex gap-6 text-sm">
            <Link href="#rooms">Rooms</Link>
            <Link href="#dining">Dining</Link>
            <Link href="#about">About</Link>
          </div>

          <div className="flex gap-2">
            <Link
              href="/login"
              className="border border-white px-6 py-1 rounded-md text-sm hover:bg-gold hover:text-black "
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
            src={heroImg}
            alt="Luxury Hotel"
            fill
            priority
            className="object-cover"
          />{" "}
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
              href="/rooms"
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

        <div className="grid md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <motion.div
              key={room.name}
              whileHover={{ scale: 1.05 }}
              className="bg-card rounded-xl overflow-hidden shadow-lg"
            >
              <Image
                src={room.img}
                alt={room.name}
                width={600}
                height={400}
                className="h-56 w-full object-cover"
              />

              <div className="p-4">
                <h3 className="font-serif text-xl">{room.name} Room</h3>
                <p className="text-sm text-muted-foreground">
                  Premium comfort with luxury service
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
       <section className="bg-hero text-primary-foreground py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-gold">Reserve</span>
          <h2 className="mt-3 font-serif text-4xl md:text-6xl">Your stay begins here.</h2>
          <p className="mt-4 text-primary-foreground/80">Create an account to book, order in-room dining, and manage your stay end-to-end.</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-gold text-primary hover:bg-gold/90"><Link href="/signup">Create account</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-primary-foreground bg-transparent hover:bg-white/10 hover:text-gold"><Link href="/rooms">Browse rooms</Link></Button>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
