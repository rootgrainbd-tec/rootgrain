"use client";

import React, { useState } from "react";
import { RoleFormData, RoleValidator } from "./role-validator";
import { ActionState } from "../shared/types";

interface RoleFormProps {
  initialData?: RoleFormData;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({ initialData, onSubmit, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormData>(
    initialData || { name: "", description: "", enabled: true }
  );
  const [state, setState] = useState<ActionState>({ isLoading: false, error: null, success: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ isLoading: true, error: null, success: false });

    const validation = RoleValidator.validate(formData);
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
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={state.isLoading}
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
