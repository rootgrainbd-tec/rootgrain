"use client";

import React, { useState } from "react";
import { PermissionFormData, PermissionValidator } from "./permission-validator";
import { ActionState } from "../shared/types";

interface PermissionFormProps {
  initialData?: PermissionFormData;
  onSubmit: (data: PermissionFormData) => Promise<void>;
  onCancel: () => void;
}

export function PermissionForm({ initialData, onSubmit, onCancel }: PermissionFormProps) {
  const [formData, setFormData] = useState<PermissionFormData>(
    initialData || { action: "", resource: "", description: "" }
  );
  const [state, setState] = useState<ActionState>({ isLoading: false, error: null, success: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ isLoading: true, error: null, success: false });

    const validation = PermissionValidator.validate(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
      {state.error && <div className="text-red-600 bg-red-50 p-2 rounded">{state.error}</div>}
      
      <div>
        <label className="block text-sm font-medium">Resource</label>
        <input
          type="text"
          value={formData.resource}
          onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
          disabled={state.isLoading || !!initialData} // Usually can't edit resource once created
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Action</label>
        <input
          type="text"
          value={formData.action}
          onChange={(e) => setFormData({ ...formData, action: e.target.value })}
          disabled={state.isLoading || !!initialData} // Usually can't edit action once created
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <input
          type="text"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={state.isLoading}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
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
