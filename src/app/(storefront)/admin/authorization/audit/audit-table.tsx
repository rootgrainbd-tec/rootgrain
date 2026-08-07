"use client";

import React from "react";
import { EmptyState } from "../shared/empty-state";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  decision: "ALLOW" | "DENY";
  reason: string;
}

interface AuditTableProps {
  data: AuditLogEntry[];
}

export function AuditTable({ data }: AuditTableProps) {
  if (!data || data.length === 0) {
    return <EmptyState title="No Audit Logs" description="No audit events match your filters." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">Timestamp ↕</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decision</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((log) => (
            <tr key={log.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.actor}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.decision === 'ALLOW' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {log.decision}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{log.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
