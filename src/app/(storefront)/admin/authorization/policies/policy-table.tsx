"use client";

import React from "react";
import { PolicyFormData } from "./policy-validator";
import { TableProps } from "../shared/types";
import { EmptyState } from "../shared/empty-state";

export function PolicyTable({ data, onEdit, onToggleStatus }: TableProps<PolicyFormData>) {
  if (!data || data.length === 0) {
    return <EmptyState title="No Policies Found" description="There are currently no policies to display." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effect</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((policy) => (
            <tr key={policy.id || policy.name}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{policy.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.effect === 'ALLOW' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {policy.effect}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{policy.resource || "*"}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {policy.enabled ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {onToggleStatus && (
                  <button onClick={() => onToggleStatus(policy)} className="text-indigo-600 hover:text-indigo-900">
                    {policy.enabled ? 'Disable' : 'Enable'}
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(policy)} className="text-blue-600 hover:text-blue-900">
                    Edit
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
