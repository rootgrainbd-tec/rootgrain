"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateInquiryStatus } from "@/app/actions/admin";

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  message: string;
  productId: string | null;
  status: string;
  createdAt: Date;
}

export function InquiryTable({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(id);
    try {
      const result = await updateInquiryStatus(id, newStatus);
      if (result.success) {
        setInquiries(inquiries.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
        toast.success("Status updated!");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--walnut-light)]/20">
            <th className="p-4 font-serif text-[var(--walnut-dark)]">Date</th>
            <th className="p-4 font-serif text-[var(--walnut-dark)]">Name</th>
            <th className="p-4 font-serif text-[var(--walnut-dark)]">Phone</th>
            <th className="p-4 font-serif text-[var(--walnut-dark)]">Message</th>
            <th className="p-4 font-serif text-[var(--walnut-dark)]">Product ID</th>
            <th className="p-4 font-serif text-[var(--walnut-dark)]">Status</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[var(--walnut-light)]">
                No inquiries found.
              </td>
            </tr>
          ) : (
            inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="border-b border-[var(--walnut-light)]/10 hover:bg-[var(--cream)]">
                <td className="p-4 text-sm">{format(new Date(inquiry.createdAt), "dd MMM yyyy")}</td>
                <td className="p-4 text-sm font-medium">{inquiry.name}</td>
                <td className="p-4 text-sm">{inquiry.phone}</td>
                <td className="p-4 text-sm max-w-xs truncate" title={inquiry.message}>{inquiry.message}</td>
                <td className="p-4 text-sm">{inquiry.productId || "-"}</td>
                <td className="p-4 text-sm">
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                    disabled={loading === inquiry.id}
                    className="border border-[var(--walnut-light)]/20 rounded p-1 bg-white text-sm focus:outline-none focus:border-[var(--gold)]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="RESPONDED">Responded</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
