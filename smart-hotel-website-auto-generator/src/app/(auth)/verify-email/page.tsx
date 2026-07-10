import { Suspense } from "react";
import VerifyEmail from "../../../components/verifyEmail/VerifyEmail";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmail />
    </Suspense>
  );
}
