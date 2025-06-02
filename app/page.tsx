'use client';

import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import CompanyTable from './components/CompanyTable';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';

interface Company {
  name: string;
  address: string;
  location: {
    lat: number;
    lon: number;
  };
  website: string | null;
  email: string | null;
  scrapedContent: string | null;
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to search for companies
  const searchCompanies = async (latitude: number, longitude: number, radius: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Searching with radius:', radius, 'km');
      
      // Log the full request parameters
      const requestParams = {
        latitude,
        longitude,
        radius, // API will convert to meters
      };
      console.log('Request parameters:', requestParams);
      
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const companiesFound = data.companies || [];
      console.log(`Found ${companiesFound.length} companies with the specified radius`);
      setCompanies(companiesFound);
    } catch (err: any) {
      setError(`Error searching companies: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-sans">
      <div className="w-full">
        <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-2 sm:mb-3 text-left">Company Finder</h1>
        <p className="text-gray-500 mb-8 sm:mb-12 text-left text-base sm:text-lg">
          Discover companies with contact information near you
        </p>

        <SearchForm onSearch={searchCompanies} />
        
        {loading && <LoadingState />}
        
        {error && (
          <div className="border-l-2 border-red-400 bg-red-50 p-4 mb-8 text-red-600">
            {error}
          </div>
        )}
        
        {companies.length > 0 && <CompanyTable companies={companies} />}
        
        {companies.length === 0 && !loading && !error && <EmptyState />}
      </div>
    </main>
  );
}