'use client';

import React from 'react';

export default function EmptyState() {
  return (
    <div className="text-left py-16">
      <p className="text-gray-500 mb-2">No companies found</p>
      <p className="text-gray-400 text-sm">Try adjusting your search parameters</p>
    </div>
  );
}
