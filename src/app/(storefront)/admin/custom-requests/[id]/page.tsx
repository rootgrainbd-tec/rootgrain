import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import QuotePrepClient from "./QuotePrepClient";

export const metadata = {
  title: "Custom Request Detail | Admin",
};

export default async function AdminCustomRequestDetailPage({ params }: { params: { id: string } }) {
  const request = await prisma.customRequest.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      events: {
        orderBy: { occurredAt: 'desc' }
      }
    }
  });

  if (!request) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/custom-requests" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Request {request.id.slice(0, 8).toUpperCase()}
        </h1>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {request.status}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-medium">
              Requested Items
            </div>
            <div className="divide-y">
              {request.items.map(item => (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">Qty: {item.quantity}</span>
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                    {item.designSpecs && <div><strong>Specs:</strong> {item.designSpecs}</div>}
                    {item.dimensions && <div><strong>Dims:</strong> {item.dimensions}</div>}
                    {item.material && <div><strong>Material:</strong> {item.material}</div>}
                    {item.finish && <div><strong>Finish:</strong> {item.finish}</div>}
                    {item.notes && <div className="col-span-2"><strong>Notes:</strong> {item.notes}</div>}
                    {item.agreedUnitPrice !== null && (
                      <div className="col-span-2 mt-2 pt-2 border-t text-green-700">
                        <strong>Agreed Unit Price:</strong> BDT {item.agreedUnitPrice}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-medium">
              Event History
            </div>
            <div className="p-4 space-y-4">
              {request.events.map(ev => (
                <div key={ev.id} className="flex gap-4 text-sm">
                  <div className="text-gray-500 whitespace-nowrap">
                    {format(new Date(ev.occurredAt), "MMM d, HH:mm")}
                  </div>
                  <div>
                    <span className="font-medium">{ev.eventType}</span>
                    {ev.payload && (
                      <pre className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Actor: {(ev.actor as any)?.id || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <QuotePrepClient request={request} />
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-medium">
              Customer Info
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <span className="block text-gray-500 text-xs">Name</span>
                <span className="font-medium">{request.customerName}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs">Mobile</span>
                <span className="font-medium">{request.mobileNumber}</span>
              </div>
              {request.email && (
                <div>
                  <span className="block text-gray-500 text-xs">Email</span>
                  <span className="font-medium">{request.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-medium">
              Request Info
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <span className="block text-gray-500 text-xs">Channel</span>
                <span className="font-medium">{request.channel}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs">Submitted Date</span>
                <span className="font-medium">{format(new Date(request.createdAt), "PPP")}</span>
              </div>
              {request.estimatedCompletionDate && (
                <div>
                  <span className="block text-gray-500 text-xs">Estimated Completion</span>
                  <span className="font-medium text-indigo-700">{format(new Date(request.estimatedCompletionDate), "PPP")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
