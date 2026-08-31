"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminOfflineRequestSchema } from "@/lib/validations/custom-request.schema";
import { createCustomRequestOffline } from "@/app/actions/custom-request";

type FormData = z.infer<typeof AdminOfflineRequestSchema>;

export default function AdminRequestForm() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{ referenceNumber: string } | null>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(AdminOfflineRequestSchema),
    defaultValues: {
      items: [{ name: "", quantity: 1, agreedUnitPrice: undefined }],
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
      // Data transformations: handle empty inputs that should be null/undefined for zod
      const processedData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          agreedUnitPrice: item.agreedUnitPrice === "" as any ? undefined : item.agreedUnitPrice
        }))
      };

      const response = await createCustomRequestOffline(processedData, idempotencyKey);
      
      if (response.success) {
        setSubmitStatus("success");
        setSuccessData({
          referenceNumber: response.referenceNumber!
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
      <div className="p-8 max-w-2xl mx-auto bg-white rounded shadow text-center border border-green-200">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Request Created Successfully (Offline Channel)</h2>
        <p className="mb-2">Reference number:</p>
        <div className="text-3xl font-mono bg-gray-100 p-4 rounded mb-4">{successData.referenceNumber}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <div>
        <h2 className="text-xl font-bold border-b pb-2 mb-4 text-gray-800">Offline Customer Information</h2>
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
        <h2 className="text-xl font-bold border-b pb-2 mb-4 text-gray-800">Requested Items & Offline Pricing</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded mb-4 relative bg-gray-50 border-gray-200">
            {fields.length > 1 && (
              <button 
                type="button" 
                onClick={() => remove(index)}
                className="absolute top-2 right-2 text-red-500 text-sm font-bold"
              >
                Remove Item
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Item Name *</label>
                <input {...register(`items.${index}.name`)} className="w-full border rounded p-2" />
                {errors.items?.[index]?.name && <p className="text-red-500 text-sm">{errors.items[index]?.name?.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border rounded p-2" />
                {errors.items?.[index]?.quantity && <p className="text-red-500 text-sm">{errors.items[index]?.quantity?.message}</p>}
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Design Specs (Optional)</label>
                <textarea {...register(`items.${index}.designSpecs`)} className="w-full border rounded p-2" rows={2}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dimensions (Optional)</label>
                <input {...register(`items.${index}.dimensions`)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Material (Optional)</label>
                <input {...register(`items.${index}.materialPreference`)} className="w-full border rounded p-2" />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                <label className="block text-sm font-bold text-yellow-800 mb-1">Agreed Unit Price (Optional)</label>
                <input 
                  type="number" 
                  {...register(`items.${index}.agreedUnitPrice`, { valueAsNumber: true })} 
                  className="w-full border rounded p-2" 
                  placeholder="e.g. 5000"
                />
                {errors.items?.[index]?.agreedUnitPrice && <p className="text-red-500 text-sm">{errors.items[index]?.agreedUnitPrice?.message}</p>}
                <p className="text-xs text-yellow-700 mt-1">If commercial terms were agreed offline.</p>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={() => append({ name: "", quantity: 1, agreedUnitPrice: undefined })}
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
        className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {submitStatus === "submitting" ? "Creating Request..." : "Create Offline Custom Request"}
      </button>
    </form>
  );
}
