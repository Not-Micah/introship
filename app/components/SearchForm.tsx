'use client';

import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (latitude: number, longitude: number, radius: number) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radius, setRadius] = useState<string>('2.5');
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

  // Function to handle search
  const handleSearch = () => {
    if (!latitude || !longitude) {
      setError('Please enter latitude and longitude');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Parse values
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const radiusValue = parseFloat(radius);
      
      // Call the parent's onSearch function
      onSearch(lat, lon, radiusValue);
    } catch (err: any) {
      setError(`Error with search parameters: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-b border-gray-100 py-6 sm:py-10 mb-6 sm:mb-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col">
          <label htmlFor="latitude" className="mb-2 text-gray-500 text-sm font-medium text-left">Latitude</label>
          <input
            id="latitude"
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Enter latitude"
            className="p-2 sm:p-3 border border-gray-200 w-full focus:outline-none focus:border-gray-400 transition-all rounded-sm"
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
            className="p-2 sm:p-3 border border-gray-200 w-full focus:outline-none focus:border-gray-400 transition-all rounded-sm"
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
            className="p-2 sm:p-3 border border-gray-200 w-full focus:outline-none focus:border-gray-400 transition-all rounded-sm"
          />
        </div>
      </div>
      
      <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-start">
        <button 
          className={`py-2 sm:py-3 px-4 sm:px-6 border border-gray-200 text-gray-700 transition-colors rounded-sm ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          onClick={getCurrentLocation}
          disabled={loading}
        >
          Get Current Location
        </button>
        
        <button 
          className={`py-2 sm:py-3 px-4 sm:px-6 bg-indigo-500 text-white transition-colors rounded-sm ${(loading || !latitude || !longitude) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600'}`}
          onClick={handleSearch}
          disabled={loading || !latitude || !longitude}
        >
          Search Companies
        </button>
      </div>
      
      {error && (
        <div className="border-l-2 border-red-400 bg-red-50 p-3 sm:p-4 mt-4 sm:mt-6 text-red-600 text-sm sm:text-base">
          {error}
        </div>
      )}
    </div>
  );
}
