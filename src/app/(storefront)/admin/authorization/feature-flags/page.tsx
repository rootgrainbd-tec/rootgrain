"use client";

import React, { useState } from "react";
import { FeatureFlagTable } from "./feature-flag-table";
import { FeatureFlagForm } from "./feature-flag-form";
import { FeatureFlagFormData } from "./feature-flag-validator";
import { SearchBox } from "../shared/search-box";
import { Pagination } from "../shared/pagination";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagFormData[]>([
    { key: "new_ui", mode: "PERCENTAGE", percentage: 50, enabled: true },
    { key: "beta_feature", mode: "RULE_BASED", rules: [{ field: "tier", operator: "equals", value: "beta" }], enabled: true },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFlag, setCurrentFlag] = useState<FeatureFlagFormData | undefined>();

  const handleCreate = () => {
    setCurrentFlag(undefined);
    setIsEditing(true);
  };

  const handleEdit = (flag: FeatureFlagFormData) => {
    setCurrentFlag(flag);
    setIsEditing(true);
  };

  const handleToggleStatus = (flag: FeatureFlagFormData) => {
    setFlags(flags.map(f => f.key === flag.key ? { ...f, enabled: !f.enabled } : f));
  };

  const handleSubmit = async (data: FeatureFlagFormData) => {
    // Mock save
    const exists = flags.some(f => f.key === data.key);
    if (exists) {
      setFlags(flags.map(f => f.key === data.key ? data : f));
    } else {
      setFlags([...flags, data]);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Feature Flag Management</h1>
        {!isEditing && (
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">
            Create Feature Flag
          </button>
        )}
      </div>

      {isEditing ? (
        <FeatureFlagForm
          initialData={currentFlag}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-4">
          <SearchBox onSearch={(q) => console.log("Search", q)} placeholder="Search flags..." />
          <FeatureFlagTable 
            data={flags} 
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
          <Pagination total={flags.length} page={1} limit={10} onPageChange={() => {}} />
        </div>
      )}
    </div>
  );
}
