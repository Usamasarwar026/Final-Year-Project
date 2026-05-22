import Link from "next/link";
import { Hotel, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Blur */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-3xl" />

      <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-purple-500/20 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-10 shadow-2xl text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Hotel className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">
            HotelGen
          </span>
        </div>

        {/* Text */}
        <h1 className="text-6xl font-extrabold text-foreground mb-3">404</h1>

        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Page Not Found
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for does not exist or may have been moved.
        </p>

        {/* Button */}
        <Link
          href="/"
          className="w-full h-12 rounded-xl bg-gradient-brand text-white font-semibold transition flex items-center justify-center gap-2 hover:opacity-90"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back To Home
        </Link>
      </div>
    </div>
  );
}
