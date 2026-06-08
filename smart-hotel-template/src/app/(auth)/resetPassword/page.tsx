import { Suspense } from "react";
import { ResetForm } from "@/modules/auth/resetForm/ResetForm";

export default function ResetPasswordPage() {
  return (
    <div>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <ResetForm />
      </Suspense>
    </div>
  );
}
