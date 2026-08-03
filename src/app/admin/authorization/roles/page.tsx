"use client";

import React, { useState } from "react";
import { RoleTable } from "./role-table";
import { RoleForm } from "./role-form";
import { RoleFormData } from "./role-validator";
import { SearchBox } from "../shared/search-box";
import { Pagination } from "../shared/pagination";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleFormData[]>([
    { id: "1", name: "SuperAdmin", description: "Full access", enabled: true },
    { id: "2", name: "Editor", description: "Can edit content", enabled: true },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleFormData | undefined>();

  const handleCreate = () => {
    setCurrentRole(undefined);
    setIsEditing(true);
  };

  const handleEdit = (role: RoleFormData) => {
    setCurrentRole(role);
    setIsEditing(true);
  };

  const handleToggleStatus = (role: RoleFormData) => {
    setRoles(roles.map(r => r.id === role.id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSubmit = async (data: RoleFormData) => {
    // Mock save
    if (data.id) {
      setRoles(roles.map(r => r.id === data.id ? data : r));
    } else {
      setRoles([...roles, { ...data, id: Date.now().toString() }]);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Role Management</h1>
        {!isEditing && (
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">
            Create Role
          </button>
        )}
      </div>

      {isEditing ? (
        <RoleForm
          initialData={currentRole}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-4">
          <SearchBox onSearch={(q) => console.log("Search", q)} placeholder="Search roles..." />
          <RoleTable 
            data={roles} 
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
          <Pagination total={roles.length} page={1} limit={10} onPageChange={() => {}} />
        </div>
      )}
    </div>
  );
}
