import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export const metadata = {
  title: "Custom Requests | Admin",
};

export default async function AdminCustomRequestsPage() {
  const requests = await prisma.customRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Requests</h1>
        <Link 
          href="/admin/custom-requests/new" 
          className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition"
        >
          + New Offline Request
        </Link>
      </div>
      
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm text-gray-600 uppercase tracking-wider">
              <th className="p-4 font-medium">Ref</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Mobile</th>
              <th className="p-4 font-medium">Channel</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm text-gray-800">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.id.slice(0, 8).toUpperCase()}</td>
                <td className="p-4 font-medium">{req.customerName}</td>
                <td className="p-4">{req.mobileNumber}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    req.channel === 'CUSTOMER_ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {req.channel}
                  </span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {req.status}
                  </span>
                </td>
                <td className="p-4">{format(new Date(req.createdAt), "MMM d, yyyy")}</td>
                <td className="p-4">
                  <Link href={`/admin/custom-requests/${req.id}`} className="text-indigo-600 font-medium hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No custom requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
