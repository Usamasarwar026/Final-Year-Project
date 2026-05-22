"use client";

import useVerifyEmail from "../../hooks/useVerifyEmail";
import { Button } from "../button/Button";

export default function VerifyEmail() {
  const { loading, success, message, handleRedirect } = useVerifyEmail();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {loading ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Verifying Email...</h1>

            <p className="text-muted-foreground">
              Please wait while we verify your email.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-4">
              {success ? "Email Verified " : "Verification Failed "}
            </h1>

            <p className="text-muted-foreground mb-6">{message}</p>

            <Button
              onClick={handleRedirect}
              className="w-full h-12 rounded-xl bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold text-base transition-all duration-300"
            >
              Go To Login
            </Button>

            {success && (
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting to login page...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
