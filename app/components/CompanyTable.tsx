'use client';

import React from 'react';

interface Location {
  lat: number;
  lon: number;
}

interface Company {
  name: string;
  address: string;
  location: Location;
  website: string | null;
  email: string | null;
  scrapedContent: string | null;
}

interface CompanyTableProps {
  companies: Company[];
}

export default function CompanyTable({ companies }: CompanyTableProps) {
  // Function to truncate URL for display
  const truncateUrl = (url: string | null): string => {
    if (!url) return '-';
    // Remove protocol and www if present
    let displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Truncate if too long
    return displayUrl.length > 25 ? displayUrl.substring(0, 22) + '...' : displayUrl;
  };

  // Function to determine scraping status and error code
  const getScrapeStatus = (content: string | null): { success: boolean; errorCode?: string } => {
    if (content === null) {
      return { success: false, errorCode: 'NOT_ATTEMPTED' };
    } else if (content.includes('ERROR:')) {
      // Extract error code if present in content
      const errorMatch = content.match(/ERROR:\s*(\w+)/);
      return { success: false, errorCode: errorMatch ? errorMatch[1] : 'UNKNOWN' };
    } else if (content.trim() === '') {
      return { success: false, errorCode: 'EMPTY_CONTENT' };
    } else {
      return { success: true };
    }
  };

  // Function to render a card view for mobile devices
  const renderMobileCard = (company: Company, index: number) => {
    const scrapeStatus = getScrapeStatus(company.scrapedContent);
    
    return (
      <div key={index} className="bg-white shadow rounded-lg p-4 mb-4">
        <h3 className="font-medium text-gray-900 text-lg mb-2">{company.name || 'Unnamed Company'}</h3>
        
        {company.address && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 block mb-1">Address</span>
            <div className="text-sm text-gray-800">{company.address}</div>
          </div>
        )}
        
        {company.email && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 block mb-1">Contact</span>
            <a href={`mailto:${company.email}`} className="text-sm text-indigo-500 hover:text-indigo-600 break-all">
              {company.email}
            </a>
          </div>
        )}
        
        {company.website && (
          <div className="mb-3">
            <span className="text-xs text-gray-500 block mb-1">Website</span>
            <a 
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-500 hover:text-indigo-600 break-all"
            >
              {truncateUrl(company.website)}
            </a>
          </div>
        )}
        
        <div className="mt-2">
          <span className="text-xs text-gray-500 block mb-1">Scrape Status</span>
          {scrapeStatus.success ? (
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-700">Success</span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-red-700">Failed</span>
                {scrapeStatus.errorCode && (
                  <span className="text-xs text-gray-500">
                    {scrapeStatus.errorCode}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-light text-gray-800 mb-4 sm:mb-6 text-left">
        Found <span className="text-indigo-500">{companies.length}</span> companies
      </h2>
      
      {/* Mobile view - card layout */}
      <div className="md:hidden">
        {companies.map((company, index) => renderMobileCard(company, index))}
      </div>
      
      {/* Desktop view - table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full bg-white shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Company</th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Address</th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Contact</th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Website</th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Scrape Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company, index) => {
              const scrapeStatus = getScrapeStatus(company.scrapedContent);
              
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 lg:px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{company.name || 'Unnamed Company'}</span>
                  </td>
                  
                  <td className="px-3 lg:px-4 py-4">
                    {company.address ? (
                      <div className="truncate max-w-xs" title={company.address}>
                        {company.address}
                      </div>
                    ) : (
                      <span className="text-gray-400">No address</span>
                    )}
                  </td>
                  
                  <td className="px-3 lg:px-4 py-4">
                    {company.email ? (
                      <a href={`mailto:${company.email}`} className="text-indigo-500 hover:text-indigo-600 truncate block max-w-[150px]" title={company.email}>
                        {company.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">No email</span>
                    )}
                  </td>
                  
                  <td className="px-3 lg:px-4 py-4">
                    {company.website ? (
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-600"
                      >
                        {truncateUrl(company.website)}
                      </a>
                    ) : (
                      <span className="text-gray-400">No website</span>
                    )}
                  </td>
                  
                  <td className="px-3 lg:px-4 py-4">
                    {scrapeStatus.success ? (
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-green-700">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-red-700">Failed</span>
                          {scrapeStatus.errorCode && (
                            <span className="text-xs text-gray-500">
                              {scrapeStatus.errorCode}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
