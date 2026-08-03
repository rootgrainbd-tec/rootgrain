"use client";

import React from "react";
import { FeatureFlagFormData } from "./feature-flag-validator";
import { TableProps } from "../shared/types";
import { EmptyState } from "../shared/empty-state";

export function FeatureFlagTable({ data, onEdit, onToggleStatus }: TableProps<FeatureFlagFormData>) {
  if (!data || data.length === 0) {
    return <EmptyState title="No Feature Flags Found" description="There are currently no feature flags to display." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Configuration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((flag) => (
            <tr key={flag.key}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{flag.key}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flag.mode}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {flag.mode === "PERCENTAGE" && `Rollout: ${flag.percentage}%`}
                {flag.mode === "RULE_BASED" && `${flag.rules?.length || 0} Rules`}
                {flag.mode === "BOOLEAN" && "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${flag.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {onToggleStatus && (
                  <button onClick={() => onToggleStatus(flag)} className="text-indigo-600 hover:text-indigo-900">
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(flag)} className="text-blue-600 hover:text-blue-900">
                    Edit / Rollout
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
