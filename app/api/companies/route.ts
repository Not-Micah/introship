import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

const GEOAPIFY_API_KEY = '7d07e1bb510e404a851a8ac48b033c88';

/**
 * Fetches nearby commercial establishments using the Geoapify Places API
 * 
 * PARAM lat - Latitude coordinate of the center point for the search
 * PARAM lon - Longitude coordinate of the center point for the search
 * PARAM radiusKm - Search radius in kilometers around the specified coordinates
 * RETURN Array of company objects from the Geoapify API or empty array if the request fails
 */
async function fetchNearbyCompanies(lat: number, lon: number, radiusKm: number) {
  try {
    // Convert radius from km to meters (API expects meters)
    const radiusMeters = radiusKm * 1000;
    
    console.log(`Making API request with radius: ${radiusMeters} meters`);
    
    const response = await axios.get('https://api.geoapify.com/v2/places', {
      params: {
        categories: 'commercial',
        filter: `circle:${lon},${lat},${radiusMeters}`,
        bias: `proximity:${lon},${lat}`,
        limit: 500, // Increased limit to get more results
        apiKey: GEOAPIFY_API_KEY
      }
    });

    return response.data.features;
  } catch (error) {
    console.error('Error fetching nearby companies:', error);
    return [];
  }
}

/**
 * Filters the company results to only include those with email addresses
 * This is important as we specifically want to target businesses with contact information
 * 
 * PARAM companies - Array of company objects from the Geoapify API
 * RETURN Filtered array containing only companies that have email addresses
 */
function filterCompaniesWithEmails(companies: any[]) {
  return companies.filter(company => 
    company.properties.contact?.email || 
    (company.properties.datasource?.raw?.contact?.email) ||
    (company.properties.datasource?.raw?.['contact:email'])
  );
}

/**
 * Extracts email address from a company object
 * Handles different possible locations of email data in the API response structure
 * 
 * @param company - Company object from the Geoapify API
 * @returns Email address as string or null if not found
 */
function extractEmail(company: any): string | null {
  return company.properties.contact?.email || 
         company.properties.datasource?.raw?.contact?.email ||
         company.properties.datasource?.raw?.['contact:email'] ||
         null;
}

/**
 * Extracts website URL from a company object
 * Checks multiple possible locations in the API response structure where website data might be stored
 * 
 * PARAM company - Company object from the Geoapify API
 * RETURN Website URL as string or null if not found
 */
function extractWebsite(company: any): string | null {
  return company.properties.contact?.website ||
         company.properties.datasource?.raw?.contact?.website ||
         company.properties.datasource?.raw?.['contact:website'] ||
         company.properties.datasource?.raw?.website ||
         null;
}

/**
 * Scrapes meaningful content from a company's website
 * Uses cheerio to parse HTML and extract relevant text content
 * Implements a hierarchical approach to find content:
 * 1. First tries to find paragraph text
 * 2. If no paragraphs, looks for headings
 * 3. If no headings, looks for divs with substantial text
 * 
 * PARAM url - Website URL to scrape
 * RETURN Extracted text content or error message
 */
// Scraping timeout in milliseconds (easy to tweak)
const SCRAPE_TIMEOUT_MS = 15000;

/**
 * Scrapes meaningful content from a company's website with retry logic
 * @param url Website URL to scrape
 * @returns Extracted text content or error message
 */
async function scrapeWebsite(url: string): Promise<string | null> {
  if (!url) return null;

  // Ensure URL has a protocol
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(formattedUrl, {
        timeout: SCRAPE_TIMEOUT_MS, // 15 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Try to extract meaningful content using multiple strategies
      // Strategy 1: Look for paragraphs with substantial content
      const paragraphs = $('p').filter(function() {
        return $(this).text().trim().length > 30;
      });
      if (paragraphs.length > 0) {
        return paragraphs.first().text().trim();
      }

      // Strategy 2: Look for meta description
      const metaDescription = $('meta[name="description"]').attr('content');
      if (metaDescription && metaDescription.length > 20) {
        return metaDescription.trim();
      }

      // Strategy 3: Look for headings
      const headings = $('h1, h2, h3').filter(function() {
        return $(this).text().trim().length > 10;
      });
      if (headings.length > 0) {
        return headings.first().text().trim();
      }

      // Strategy 4: Look for divs with substantial text content
      const contentDivs = $('div.content, div.main, div.about, div#content, div#main, div.description, div.company-info').filter(function() {
        return $(this).text().trim().length > 40;
      });
      if (contentDivs.length > 0) {
        return contentDivs.first().text().trim().substring(0, 300);
      }

      // Strategy 5: Fall back to any div with substantial text
      const anyDiv = $('div').filter(function() {
        return $(this).text().trim().length > 40;
      }).first().text().trim();
      return anyDiv || "No meaningful content found";
    } catch (error: any) {
      lastError = error;
      // Only retry on timeout or network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn(`Timeout scraping ${formattedUrl} (attempt ${attempt}/${maxAttempts})`);
        if (attempt < maxAttempts) {
          await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retry
          continue;
        }
      }
      break; // For other errors, don't retry
    }
  }
  console.error(`Error scraping website ${url}:`, lastError);
  return `Failed to scrape: ${(lastError as Error).message}`;
}

/**
 * POST endpoint handler for the /api/companies route
 * Processes incoming requests with location data to find nearby companies
 * 
 * Request body should contain:
 * - latitude: number (required)
 * - longitude: number (required)
 * - radius: number (optional, defaults to 2.5km)
 * 
 * RETURN JSON response with company data or error message
 */
export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, radius = 2.5 } = await request.json();
    
    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }
    
    const radiusKm = parseFloat(radius.toString());

    // Fetch nearby companies
    const companies = await fetchNearbyCompanies(latitude, longitude, radiusKm);
    
    // Filter companies with emails
    const companiesWithEmails = filterCompaniesWithEmails(companies);
    
    // Process each company to extract data and scrape website
    const processedCompanies = await Promise.all(
      companiesWithEmails.map(async (company) => {
        const website = extractWebsite(company);
        const email = extractEmail(company);
        
        // Scrape website content if available
        const scrapedContent = website ? await scrapeWebsite(website) : null;
        
        return {
          name: company.properties.name,
          address: company.properties.formatted,
          location: {
            lat: company.properties.lat,
            lon: company.properties.lon
          },
          website,
          email,
          scrapedContent
        };
      })
    );
    
    return NextResponse.json({ companies: processedCompanies });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

/**
 * GET endpoint handler for the /api/companies route
 * Provides instructions for using the API
 * 
 * RETURN JSON response with usage instructions
 */
export async function GET() {
  return NextResponse.json({ message: 'Use POST method with latitude and longitude to search for companies' });
}
