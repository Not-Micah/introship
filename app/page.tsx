'use client';

import React, { useState } from 'react';

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
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radius, setRadius] = useState<string>('2.5');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to get user's current location
  const getCurrentLocation = () => {
    setError(null);
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setLoading(false);
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  // Function to search for companies
  const searchCompanies = async () => {
    if (!latitude || !longitude) {
      setError('Please enter latitude and longitude');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Ensure radius is properly parsed as a number (in kilometers)
      const radiusValue = parseFloat(radius);
      console.log('Searching with radius:', radiusValue, 'km');
      
      // Log the full request parameters
      const requestParams = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: radiusValue, // API will convert to meters
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
    <main className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <h1 className="text-4xl font-light text-gray-800 mb-3 text-left">Company Finder</h1>
      <p className="text-gray-500 mb-12 text-left text-lg">
        Discover companies with contact information near you
      </p>

      <div className="border-t border-b border-gray-100 py-10 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col">
            <label htmlFor="latitude" className="mb-2 text-gray-500 text-sm font-medium text-left">Latitude</label>
            <input
              id="latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Enter latitude"
              className="p-3 border border-gray-200 w-full focus:outline-none focus:border-gray-400 transition-all"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="longitude" className="mb-2 text-gray-500 text-sm font-medium text-left">Longitude</label>
            <input
              id="longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Enter longitude"
              className="p-3 border border-gray-200 w-full focus:outline-none focus:border-gray-400 transition-all"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="radius" className="mb-2 text-gray-500 text-sm font-medium text-left">Radius (km)</label>
            <input
              id="radius"
              type="number"
              min="0.1"
              max="25"
              step="0.5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="Search radius"
              className="p-3 border border-gray-200 w-full focus:outline-none focus:border-gray-400 transition-all"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-start">
          <button 
            className={`py-3 px-6 border border-gray-200 text-gray-700 transition-colors ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            onClick={getCurrentLocation}
            disabled={loading}
          >
            Get Current Location
          </button>
          
          <button 
            className={`py-3 px-6 bg-indigo-500 text-white transition-colors ${(loading || !latitude || !longitude) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600'}`}
            onClick={searchCompanies}
            disabled={loading || !latitude || !longitude}
          >
            Search Companies
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-left py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Searching for companies...</p>
        </div>
      )}
      
      {error && (
        <div className="border-l-2 border-red-400 bg-red-50 p-4 mb-8 text-red-600">
          {error}
        </div>
      )}
      
      {companies.length > 0 && (
        <div>
          <h2 className="text-2xl font-light text-gray-800 mb-8 text-left">
            Found <span className="text-indigo-500">{companies.length}</span> companies
          </h2>
          <div className="grid grid-cols-1 gap-8">
            {companies.map((company, index) => (
              <div key={index} className="border-b border-gray-100 pb-8">
                <h3 className="text-xl font-medium text-gray-800 mb-4">{company.name || 'Unnamed Company'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.address && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm mb-1">Address</span>
                      <span className="text-gray-800">{company.address}</span>
                    </div>
                  )}
                  
                  {company.email && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm mb-1">Email</span>
                      <span className="text-gray-800">{company.email}</span>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm mb-1">Website</span>
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-600"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
                
                {company.scrapedContent && (
                  <div className="mt-4">
                    <span className="text-gray-500 text-sm block mb-1">Website Content</span>
                    <p className="text-gray-700 text-sm">
                      {company.scrapedContent.substring(0, 150)}...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {companies.length === 0 && !loading && !error && (
        <div className="text-left py-16">
          <p className="text-gray-500 mb-2">No companies found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search parameters</p>
        </div>
      )}
    </main>
  );
}