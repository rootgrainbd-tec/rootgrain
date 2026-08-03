"use client";

import React from "react";
import { RoleFormData } from "./role-validator";
import { TableProps } from "../shared/types";
import { EmptyState } from "../shared/empty-state";

export function RoleTable({ data, onEdit, onToggleStatus }: TableProps<RoleFormData>) {
  if (!data || data.length === 0) {
    return <EmptyState title="No Roles Found" description="There are currently no roles to display." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((role) => (
            <tr key={role.id || role.name}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{role.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{role.description}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {role.enabled ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {onToggleStatus && (
                  <button onClick={() => onToggleStatus(role)} className="text-indigo-600 hover:text-indigo-900">
                    {role.enabled ? 'Disable' : 'Enable'}
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(role)} className="text-blue-600 hover:text-blue-900">
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
