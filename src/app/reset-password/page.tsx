import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col justify-center py-12">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    }>
      <ResetPasswordClient />
    </Suspense>
  );
}
