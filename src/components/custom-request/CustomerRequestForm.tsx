"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomerOnlineRequestSchema } from "@/lib/validations/custom-request.schema";
import { submitCustomRequestOnline } from "@/app/actions/custom-request";

type FormData = z.infer<typeof CustomerOnlineRequestSchema>;

export default function CustomerRequestForm() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{ referenceNumber: string, rawGuestToken?: string } | null>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(CustomerOnlineRequestSchema),
    defaultValues: {
      items: [{ name: "", quantity: 1 }],
      customerName: "",
      mobileNumber: "",
      email: "",
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const onSubmit = async (data: FormData) => {
    setSubmitStatus("submitting");
    setErrorMessage("");
    
    // Generate idempotency key in client
    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await submitCustomRequestOnline(data, idempotencyKey);
      
      if (response.success) {
        setSubmitStatus("success");
        setSuccessData({
          referenceNumber: response.referenceNumber!,
          rawGuestToken: response.rawGuestToken
        });
      } else {
        setSubmitStatus("error");
        setErrorMessage(response.error || "An unknown error occurred.");
      }
    } catch (err: any) {
      setSubmitStatus("error");
      setErrorMessage(err.message || "Failed to submit request");
    }
  };

  if (submitStatus === "success" && successData) {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-white rounded shadow text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Request Submitted Successfully</h2>
        <p className="mb-2">Your reference number is:</p>
        <div className="text-3xl font-mono bg-gray-100 p-4 rounded mb-4">{successData.referenceNumber}</div>
        
        {successData.rawGuestToken && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-left">
            <h3 className="font-bold text-yellow-800">Save Your Tracking Token</h3>
            <p className="text-sm text-yellow-700 mt-2">
              Since you are not logged in, please save this secure token link to track your request. If you provided an email, this link will also be emailed to you.
            </p>
            <div className="mt-2 font-mono text-xs break-all bg-white p-2 border">
              #token={successData.rawGuestToken}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <div>
        <h2 className="text-xl font-bold border-b pb-2 mb-4">Your Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input {...register("customerName")} className="w-full border rounded p-2" />
            {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number *</label>
            <input {...register("mobileNumber")} className="w-full border rounded p-2" />
            {errors.mobileNumber && <p className="text-red-500 text-sm">{errors.mobileNumber.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Email (Optional)</label>
            <input {...register("email")} type="email" className="w-full border rounded p-2" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold border-b pb-2 mb-4">Requested Items</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded mb-4 relative bg-gray-50">
            {fields.length > 1 && (
              <button 
                type="button" 
                onClick={() => remove(index)}
                className="absolute top-2 right-2 text-red-500 text-sm font-bold"
              >
                Remove Item
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name *</label>
                <input {...register(`items.${index}.name`)} className="w-full border rounded p-2" />
                {errors.items?.[index]?.name && <p className="text-red-500 text-sm">{errors.items[index]?.name?.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border rounded p-2" />
                {errors.items?.[index]?.quantity && <p className="text-red-500 text-sm">{errors.items[index]?.quantity?.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Design Specs (Optional)</label>
                <textarea {...register(`items.${index}.designSpecs`)} className="w-full border rounded p-2" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dimensions (Optional)</label>
                <input {...register(`items.${index}.dimensions`)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Material Preference (Optional)</label>
                <input {...register(`items.${index}.materialPreference`)} className="w-full border rounded p-2" />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={() => append({ name: "", quantity: 1 })}
          className="mt-2 bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300 transition"
        >
          + Add Another Item
        </button>
      </div>

      {submitStatus === "error" && (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <button 
        type="submit" 
        disabled={submitStatus === "submitting"}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {submitStatus === "submitting" ? "Submitting..." : "Submit Custom Request"}
      </button>
    </form>
  );
}
