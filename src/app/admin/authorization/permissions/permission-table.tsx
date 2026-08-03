"use client";

import React from "react";
import { PermissionFormData } from "./permission-validator";
import { EmptyState } from "../shared/empty-state";

interface PermissionTableProps {
  data: PermissionFormData[];
  onRevoke?: (item: PermissionFormData) => void;
}

export function PermissionTable({ data, onRevoke }: PermissionTableProps) {
  if (!data || data.length === 0) {
    return <EmptyState title="No Permissions Found" description="There are currently no permissions to display." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((permission) => (
            <tr key={`${permission.resource}:${permission.action}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{permission.resource}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permission.action}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{permission.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {onRevoke && (
                  <button onClick={() => onRevoke(permission)} className="text-red-600 hover:text-red-900">
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
