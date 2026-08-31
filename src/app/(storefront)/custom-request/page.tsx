import CustomerRequestForm from "@/components/custom-request/CustomerRequestForm";
import React from "react";

export const metadata = {
  title: "Submit a Custom Request | RootGrain",
  description: "Request a custom bespoke order from RootGrain.",
};

export default function CustomRequestPage() {
  return (
    <div className="bg-[var(--cream)] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--walnut)]">
          Bespoke Custom Requests
        </h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Looking for something completely custom? Provide us with the details and our team will prepare a quotation for you.
        </p>
        
        <CustomerRequestForm />
      </div>
    </div>
  );
}
