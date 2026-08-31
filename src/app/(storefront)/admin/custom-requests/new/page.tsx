import AdminRequestForm from "@/components/custom-request/AdminRequestForm";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "New Offline Custom Request | Admin",
};

export default function AdminNewCustomRequestPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/custom-requests" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Offline Custom Request</h1>
      </div>
      
      <p className="text-gray-600 mb-8 max-w-2xl">
        Use this form to log a custom request on behalf of a customer who contacted you offline (e.g. by phone or in person). If commercial terms have been agreed, you may enter the Agreed Unit Price.
      </p>
      
      <AdminRequestForm />
    </div>
  );
}
