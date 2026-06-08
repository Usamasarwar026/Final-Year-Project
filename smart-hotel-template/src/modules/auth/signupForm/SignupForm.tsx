"use client";
import Link from "next/link";
import { useState } from "react";
import * as Yup from "yup";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "../../../components/button/Button";
import { Input } from "../../../components/input/Input";
import { Label } from "../../../components/label/Label";
import { Card } from "../../../components/card/Card";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/services/authService";
import { useRouter } from "next/navigation";
import { WebsiteName, IMAGES } from "@/constant/constant";

const registerSchema = Yup.object({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});
export const SignupForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data.message || "Registration successful");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Registration failed");
    },
  });
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerSchema.validate(
        {
          name,
          email,
          password,
        },
        { abortEarly: false },
      );

      mutation.mutate({
        name,
        email,
        password,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        toast.error(error.errors[0]);
      }
    }
  };

  const loading = mutation.isPending;

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <Image
          src={IMAGES.heroImage}
          alt="hotel"
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="font-serif text-2xl text-gold">
            {WebsiteName}
          </Link>
          <div>
            <h2 className="font-serif text-4xl">Begin your stay.</h2>
            <p className="mt-2 text-primary-foreground/80 max-w-sm">
              A single account for bookings, dining, billing and concierge
              requests.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md p-8 border-0 shadow-elegant">
          <h1 className="font-serif text-3xl text-primary">Create account</h1>
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
          
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
