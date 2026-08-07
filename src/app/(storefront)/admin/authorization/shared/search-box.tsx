"use client";

import React, { useState } from "react";

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ placeholder = "Search...", onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2"
      />
      <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
        Search
      </button>
    </form>
  );
}
