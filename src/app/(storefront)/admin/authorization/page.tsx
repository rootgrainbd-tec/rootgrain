import React from "react";

export default function AdminAuthorizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Authorization Admin</h1>
        <nav className="flex space-x-4 mt-2">
          <a href="/admin/authorization/roles" className="text-blue-600 hover:underline">Roles</a>
          <a href="/admin/authorization/permissions" className="text-blue-600 hover:underline">Permissions</a>
          <a href="/admin/authorization/policies" className="text-blue-600 hover:underline">Policies</a>
          <a href="/admin/authorization/feature-flags" className="text-blue-600 hover:underline">Feature Flags</a>
          <a href="/admin/authorization/audit" className="text-blue-600 hover:underline">Audit Logs</a>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
