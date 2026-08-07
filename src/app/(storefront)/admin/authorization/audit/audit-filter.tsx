"use client";

import React, { useState } from "react";

interface AuditFilterProps {
  onFilterChange: (filters: { action?: string; resource?: string; decision?: string }) => void;
}

export function AuditFilter({ onFilterChange }: AuditFilterProps) {
  const [filters, setFilters] = useState({ action: "", resource: "", decision: "" });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex space-x-4 p-4 border rounded bg-gray-50 mb-4">
      <div>
        <label className="block text-xs font-medium text-gray-700">Action</label>
        <input 
          type="text" 
          name="action" 
          value={filters.action} 
          onChange={handleChange}
          placeholder="Filter action..."
          className="mt-1 block rounded border-gray-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Resource</label>
        <input 
          type="text" 
          name="resource" 
          value={filters.resource} 
          onChange={handleChange}
          placeholder="Filter resource..."
          className="mt-1 block rounded border-gray-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Decision</label>
        <select 
          name="decision" 
          value={filters.decision} 
          onChange={handleChange}
          className="mt-1 block rounded border-gray-300 text-sm"
        >
          <option value="">All</option>
          <option value="ALLOW">ALLOW</option>
          <option value="DENY">DENY</option>
        </select>
      </div>
    </div>
  );
}
