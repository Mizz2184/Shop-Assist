import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@/types/product';
import pLimit from 'p-limit';
// Remove the unused import
// import { TranslationServiceClient } from '@google-cloud/translate';
// Remove Supabase import if not needed
// import { createClient } from '@supabase/supabase-js';

// Remove Supabase initialization
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Google Cloud Translation
// const translate = new Translate({
//   projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
//   key: process.env.GOOGLE_CLOUD_API_KEY
// });

// Create a rate limiter that allows 2 concurrent requests
const limit = pLimit(2);

// Create a request queue for MaxiPali API
const maxipaliQueue = new Map();
const QUEUE_TIMEOUT = 5000; // 5 seconds

// Function to translate text between languages
async function translateText(text: string, from: string, to: string): Promise<string> {
  try {
    // For now, just return the original text to avoid translation API costs
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Helper function to wait for a specific duration
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if we should throttle requests
function shouldThrottle(store: string): boolean {
  const now = Date.now();
  const lastRequest = maxipaliQueue.get(store);
  
  if (!lastRequest) {
    maxipaliQueue.set(store, now);
    return false;
  }
  
  if (now - lastRequest < QUEUE_TIMEOUT) {
    return true;
  }
  
  maxipaliQueue.set(store, now);
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const stores = searchParams.get('stores')?.split(',') || ['maxipali'];
    const language = searchParams.get('language') || 'en';
    const category = searchParams.get('category') || '';

    // Validate query
    if (!query.trim()) {
      return NextResponse.json([], { status: 400 });
    }

    console.log(`Searching for "${query}" in stores: ${stores.join(', ')}`);

    // Translate query to both languages
    let spanishQuery = query;
    let englishQuery = query;

    if (language === 'en') {
      spanishQuery = await translateText(query, 'en', 'es');
    } else {
      englishQuery = await translateText(query, 'es', 'en');
    }

    console.log(`Search queries - English: "${englishQuery}", Spanish: "${spanishQuery}"`);

    // Array to store all products
    let allProducts: Product[] = [];

    // Search in each selected store with both queries, but limit concurrent requests
    for (const store of stores) {
      console.log(`Searching in ${store.charAt(0).toUpperCase() + store.slice(1)}...`);
      
      // Check if we should throttle requests to this store
      if (shouldThrottle(store)) {
        console.log(`Throttling requests to ${store}, waiting ${QUEUE_TIMEOUT}ms...`);
        await wait(QUEUE_TIMEOUT);
      }
      
      try {
        // Use p-limit to limit concurrent requests
        const storeProducts = await limit(async () => {
          // Search with Spanish query first
          const spanishProducts = await searchStore(store, spanishQuery, category);
          
          // Wait a bit before making the second request
          await wait(1000);
          
          // Search with English query
          const englishProducts = await searchStore(store, englishQuery, category);
          
          // Merge results, removing duplicates based on product ID
          return [...spanishProducts, ...englishProducts]
            .filter((product, index, self) => 
              index === self.findIndex((p) => p.id === product.id)
            );
        });
        
        // Add translated names to products
        const translatedProducts = await Promise.all(storeProducts.map(async (product) => {
          const translatedName = language === 'en' 
            ? await translateText(product.name, 'es', 'en')
            : await translateText(product.name, 'en', 'es');
          
          return {
            ...product,
            translatedName
          };
        }));
        
        console.log(`Found ${translatedProducts.length} products from ${store}`);
        allProducts = [...allProducts, ...translatedProducts];
      } catch (storeError) {
        console.error(`Error searching in ${store}:`, storeError);
        // Continue with other stores even if one fails
        continue;
      }
    }

    // Log the total number of products found
    console.log(`Total products found: ${allProducts.length}`);

    // If no products were found, return an empty array
    if (allProducts.length === 0) {
      console.log(`No products found for query: ${query}`);
      return NextResponse.json([]);
    }

    // Return all products
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// Helper function to search in a specific store
async function searchStore(store: string, query: string, category: string): Promise<Product[]> {
  switch (store.toLowerCase()) {
    case 'maxipali':
      return await scrapeMaxiPali(query, category);
    case 'automercado':
      return await scrapeAutomercado(query, category);
    case 'masxmenos':
      return await scrapeMasXMenos(query, category);
    case 'pricesmart':
      return await scrapePriceSmart(query, category);
    default:
      console.log(`Unknown store: ${store}`);
      return [];
  }
}

async function scrapeMaxiPali(query: string, category: string = '') {
  try {
    console.log(`Searching MaxiPali for: ${query} in category: ${category}`);
    
    // Update the search URL to request 49 products
    const searchUrl = `https://www.maxipali.co.cr/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?map=ft&_from=0&_to=49`;
    
    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/buscar?q=' + encodeURIComponent(query),
      'Origin': 'https://www.maxipali.co.cr',
      'Connection': 'keep-alive'
    };
    
    // Make the API request with better error handling
    let response;
    try {
      console.log(`Fetching from URL: ${searchUrl}`);
      response = await axios.get(searchUrl, { 
        headers,
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('MaxiPali API response status:', response.status);
    } catch (error: any) {
      console.error(`Error fetching from MaxiPali: ${error.message}`);
      return []; // Return empty array if API call fails
    }
    
    // Check if we got a valid response
    if (!response.data || !Array.isArray(response.data)) {
      console.log('MaxiPali returned no valid data');
      return [];
    }
    
    const products = response.data;
    console.log(`MaxiPali returned ${products.length} products`);
    
    if (products.length === 0) {
      return [];
    }
    
    // Transform the data to match our Product interface
    const transformedProducts = products
      .map((item: any) => {
        try {
          // Create a unique ID for the product
          const id = item.productId || uuidv4();
          
          // Get the product name and clean it
          const name = item.productName || 'Unknown Product';
          
          // Get the price
          const price = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
          
          // Get the image URL
          let imageUrl = '';
          if (item.items && item.items[0] && item.items[0].images && item.items[0].images[0]) {
            imageUrl = item.items[0].images[0].imageUrl || '';
          }
          
          // Get the brand
          const brand = item.brand || '';
          
          // Get the description
          const description = item.description || '';
          
          // Create the product URL
          const url = `https://www.maxipali.co.cr${item.link || ''}`;
          
          // Log the transformed product for debugging
          console.log(`Transformed product: ${name}, price: ${price}, image: ${imageUrl}`);
          
          return {
            id,
            name,
            brand,
            description,
            price,
            imageUrl,
            store: 'MaxiPali',
            url,
            category: category || 'abarrotes',
            ean: item.items?.[0]?.ean || ''
          };
        } catch (error) {
          console.error('Error transforming product:', error);
          return null;
        }
      })
      .filter(Boolean); // Remove any null values
    
    console.log(`Transformed ${transformedProducts.length} products from MaxiPali`);
    return transformedProducts as Product[];
  } catch (error) {
    console.error('Error in scrapeMaxiPali:', error);
    return [];
  }
}

async function scrapeAutomercado(query: string, category: string = '') {
  try {
    console.log(`Searching Automercado for: ${query}`);
    
    // TODO: Implement actual scraping logic for Automercado
    // For now, return an empty array
    return [];
  } catch (error) {
    console.error('Error scraping Automercado:', error);
    return [];
  }
}

async function scrapeMasXMenos(query: string, category: string = '') {
  try {
    console.log(`Searching Mas x Menos for: ${query}`);
    
    // TODO: Implement actual scraping logic for Mas x Menos
    // For now, return an empty array
    return [];
  } catch (error) {
    console.error('Error scraping Mas x Menos:', error);
    return [];
  }
}

async function scrapePriceSmart(query: string, category: string = '') {
  try {
    console.log(`Searching PriceSmart for: ${query}`);
    
    // TODO: Implement actual scraping logic for PriceSmart
    // For now, return an empty array
    return [];
  } catch (error) {
    console.error('Error scraping PriceSmart:', error);
    return [];
  }
}