"use client";

import React, { useState } from "react";
import { AuditTable, AuditLogEntry } from "./audit-table";
import { AuditFilter } from "./audit-filter";
import { SearchBox } from "../shared/search-box";
import { Pagination } from "../shared/pagination";

export default function AuditPage() {
  const [logs] = useState<AuditLogEntry[]>(() => [
    { id: "1", timestamp: new Date().toISOString(), actor: "user123", action: "read", resource: "orders", decision: "ALLOW", reason: "POLICY_ALLOW" },
    { id: "2", timestamp: new Date(Date.now() - 10000).toISOString(), actor: "user456", action: "delete", resource: "orders", decision: "DENY", reason: "DENY_BY_DEFAULT" },
  ]);

  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>(logs);

  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    setFilteredLogs(logs.filter(l => 
      l.actor.toLowerCase().includes(q) || 
      l.reason.toLowerCase().includes(q)
    ));
  };

  const handleFilter = (filters: any) => {
    let result = logs;
    if (filters.action) result = result.filter(l => l.action.includes(filters.action));
    if (filters.resource) result = result.filter(l => l.resource.includes(filters.resource));
    if (filters.decision) result = result.filter(l => l.decision === filters.decision);
    setFilteredLogs(result);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SearchBox onSearch={handleSearch} placeholder="Search actor or reason..." />
        </div>
        
        <AuditFilter onFilterChange={handleFilter} />
        
        <AuditTable data={filteredLogs} />
        
        <Pagination total={filteredLogs.length} page={1} limit={10} onPageChange={() => {}} />
      </div>
    </div>
  );
}
