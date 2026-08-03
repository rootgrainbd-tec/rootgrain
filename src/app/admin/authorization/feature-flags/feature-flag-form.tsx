"use client";

import React, { useState } from "react";
import { FeatureFlagFormData, FeatureFlagValidator } from "./feature-flag-validator";
import { ActionState } from "../shared/types";

interface FeatureFlagFormProps {
  initialData?: FeatureFlagFormData;
  onSubmit: (data: FeatureFlagFormData) => Promise<void>;
  onCancel: () => void;
}

export function FeatureFlagForm({ initialData, onSubmit, onCancel }: FeatureFlagFormProps) {
  const [formData, setFormData] = useState<FeatureFlagFormData>(
    initialData || { key: "", mode: "BOOLEAN", enabled: true }
  );
  const [state, setState] = useState<ActionState>({ isLoading: false, error: null, success: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ isLoading: true, error: null, success: false });

    const validation = FeatureFlagValidator.validate(formData);
    if (!validation.success) {
      setState({ isLoading: false, error: "Validation failed: " + validation.error.issues[0].message, success: false });
      return;
    }

    try {
      await onSubmit(validation.data);
      setState({ isLoading: false, error: null, success: true });
    } catch (err: any) {
      setState({ isLoading: false, error: err.message || "An error occurred", success: false });
    }
  };

  const handleAddRule = () => {
    setFormData({
      ...formData,
      rules: [...(formData.rules || []), { field: "", operator: "equals", value: "" }]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
      {state.error && <div className="text-red-600 bg-red-50 p-2 rounded">{state.error}</div>}
      
      <div>
        <label className="block text-sm font-medium">Flag Key</label>
        <input
          type="text"
          value={formData.key}
          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
          disabled={state.isLoading || !!initialData}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Mode</label>
        <select
          value={formData.mode}
          onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
          disabled={state.isLoading}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        >
          <option value="BOOLEAN">BOOLEAN</option>
          <option value="PERCENTAGE">PERCENTAGE</option>
          <option value="RULE_BASED">RULE_BASED</option>
        </select>
      </div>

      {formData.mode === "PERCENTAGE" && (
        <div>
          <label className="block text-sm font-medium">Rollout Percentage (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.percentage || 0}
            onChange={(e) => setFormData({ ...formData, percentage: parseInt(e.target.value, 10) })}
            disabled={state.isLoading}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm"
          />
        </div>
      )}

      {formData.mode === "RULE_BASED" && (
        <div className="space-y-2 border p-2 rounded">
          <label className="block text-sm font-medium">Rules</label>
          {formData.rules?.map((rule, idx) => (
            <div key={idx} className="flex space-x-2">
              <input
                type="text"
                placeholder="Field"
                value={rule.field}
                onChange={(e) => {
                  const newRules = [...(formData.rules || [])];
                  newRules[idx].field = e.target.value;
                  setFormData({ ...formData, rules: newRules });
                }}
                className="w-1/3 rounded border-gray-300 text-sm"
              />
              <select
                value={rule.operator}
                onChange={(e) => {
                  const newRules = [...(formData.rules || [])];
                  newRules[idx].operator = e.target.value as any;
                  setFormData({ ...formData, rules: newRules });
                }}
                className="w-1/3 rounded border-gray-300 text-sm"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
              </select>
              <input
                type="text"
                placeholder="Value"
                value={rule.value}
                onChange={(e) => {
                  const newRules = [...(formData.rules || [])];
                  newRules[idx].value = e.target.value;
                  setFormData({ ...formData, rules: newRules });
                }}
                className="w-1/3 rounded border-gray-300 text-sm"
              />
            </div>
          ))}
          <button type="button" onClick={handleAddRule} className="text-sm text-blue-600">
            + Add Rule
          </button>
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
          disabled={state.isLoading}
          className="rounded border-gray-300"
        />
        <label className="ml-2 text-sm font-medium">Enabled</label>
      </div>

      <div className="flex space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={state.isLoading}
          className="px-4 py-2 border rounded text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={state.isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {state.isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
