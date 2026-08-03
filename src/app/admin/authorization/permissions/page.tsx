"use client";

import React, { useState } from "react";
import { PermissionTable } from "./permission-table";
import { PermissionForm } from "./permission-form";
import { PermissionFormData } from "./permission-validator";
import { SearchBox } from "../shared/search-box";
import { Pagination } from "../shared/pagination";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionFormData[]>([
    { id: "1", resource: "orders", action: "read", description: "View orders" },
    { id: "2", resource: "orders", action: "write", description: "Modify orders" },
  ]);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = () => {
    setIsAssigning(true);
  };

  const handleRevoke = (permission: PermissionFormData) => {
    // Revocation removes the assignment but we mock it by filtering out
    setPermissions(permissions.filter(p => p.id !== permission.id));
  };

  const handleSubmit = async (data: PermissionFormData) => {
    // Mock save
    setPermissions([...permissions, { ...data, id: Date.now().toString() }]);
    setIsAssigning(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Permission Management</h1>
        {!isAssigning && (
          <button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded">
            Assign Permission
          </button>
        )}
      </div>

      {isAssigning ? (
        <PermissionForm
          onSubmit={handleSubmit}
          onCancel={() => setIsAssigning(false)}
        />
      ) : (
        <div className="space-y-4">
          <SearchBox onSearch={(q) => console.log("Search", q)} placeholder="Search permissions..." />
          <PermissionTable 
            data={permissions} 
            onRevoke={handleRevoke}
          />
          <Pagination total={permissions.length} page={1} limit={10} onPageChange={() => {}} />
        </div>
      )}
    </div>
  );
}
