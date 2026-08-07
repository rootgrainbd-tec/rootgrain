"use client";

import React, { useState } from "react";
import { PolicyTable } from "./policy-table";
import { PolicyForm } from "./policy-form";
import { PolicyFormData } from "./policy-validator";
import { SearchBox } from "../shared/search-box";
import { Pagination } from "../shared/pagination";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyFormData[]>([
    { id: "1", name: "Maintenance Mode", effect: "DENY", resource: "*", enabled: false },
    { id: "2", name: "Guest Read Access", effect: "ALLOW", resource: "public_content", enabled: true },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<PolicyFormData | undefined>();

  const handleCreate = () => {
    setCurrentPolicy(undefined);
    setIsEditing(true);
  };

  const handleEdit = (policy: PolicyFormData) => {
    setCurrentPolicy(policy);
    setIsEditing(true);
  };

  const handleToggleStatus = (policy: PolicyFormData) => {
    setPolicies(policies.map(p => p.id === policy.id ? { ...p, enabled: !p.enabled } : p));
  };

  const handleSubmit = async (data: PolicyFormData) => {
    // Mock save
    if (data.id) {
      setPolicies(policies.map(p => p.id === data.id ? data : p));
    } else {
      setPolicies([...policies, { ...data, id: Date.now().toString() }]);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Policy Management</h1>
        {!isEditing && (
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">
            Create Policy
          </button>
        )}
      </div>

      {isEditing ? (
        <PolicyForm
          initialData={currentPolicy}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-4">
          <SearchBox onSearch={(q) => console.log("Search", q)} placeholder="Search policies..." />
          <PolicyTable 
            data={policies} 
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
          <Pagination total={policies.length} page={1} limit={10} onPageChange={() => {}} />
        </div>
      )}
    </div>
  );
}
