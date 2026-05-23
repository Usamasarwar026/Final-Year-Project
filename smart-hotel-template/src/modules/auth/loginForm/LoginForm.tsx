"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import Image from "next/image";
import { toast } from "sonner";
import heroImg from "../../../../public/assets/hero-hotel.jpg";
import { Button } from "../../../components/button/Button";
import { Input } from "../../../components/input/Input";
import { Label } from "../../../components/label/Label";
import { Card } from "../../../components/card/Card";
import { Eye, EyeOff } from "lucide-react";
import { WebsiteName } from "@/constant/constant";

const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),

  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const LoginForm = () => {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      await loginSchema.validate(
        {
          email,
          password,
        },
        {
          abortEarly: false,
        },
      );

      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Login successful");

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        toast.error(error.errors.join(", "));
      } else {
        toast.error("Something went wrong");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <Image
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="font-serif text-2xl text-gold">
            {WebsiteName}
          </Link>
          <div>
            <h2 className="font-serif text-4xl">Welcome back.</h2>
            <p className="mt-2 text-primary-foreground/80 max-w-sm">
              Sign in to manage bookings, order dining, and view invoices.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md p-8 border-0 shadow-elegant">
          <h1 className="font-serif text-3xl text-primary">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            to your {WebsiteName} account
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div> */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>

                <Link
                  href="/forgetPassword"
                  className="text-sm text-accent hover:text-primary transition-colors hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full">
            Continue with Google
          </Button>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
