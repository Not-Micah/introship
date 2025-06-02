'use client';

import React from 'react';

export default function LoadingState() {
  return (
    <div className="text-left py-12">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent"></div>
      <p className="mt-4 text-gray-500">Searching for companies...</p>
    </div>
  );
}
