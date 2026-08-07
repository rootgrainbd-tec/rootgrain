import prisma from "@/lib/prisma";
import { InquiryTable } from "@/components/admin/InquiryTable";

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-serif text-[var(--walnut-dark)] mb-6">Customer Inquiries</h1>
      <div className="bg-white rounded-sm">
        <InquiryTable initialInquiries={inquiries} />
      </div>
    </div>
  );
}
