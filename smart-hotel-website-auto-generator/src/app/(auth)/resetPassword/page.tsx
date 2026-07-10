import { Suspense } from "react";
import ResetForm from "../../../components/resetForm/ResetForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
