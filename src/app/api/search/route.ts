import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@/types/product';

// Function to translate text between languages
async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text) return '';
  
  try {
    // Use the internal translation API with absolute URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3003';
    
    const response = await axios.post(`${baseUrl}/api/translate`, {
      text,
      from,
      to
    });
    
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse the URL to get the search parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const storesParam = searchParams.get('stores') || 'maxipali';
    const language = searchParams.get('language') || 'es';
    const category = searchParams.get('category') || '';
    
    console.log('Search API called with:', { query, storesParam, language, category });
    
    // Split the stores parameter into an array
    const stores = storesParam.split(',');
    
    // Translate the query if needed
    let searchQuery = query;
    if (language === 'en') {
      // Translate from English to Spanish for searching
      searchQuery = await translateText(query, 'en', 'es');
      console.log('Translated query:', searchQuery);
    }
    
    // Initialize an array to store all products
    let allProducts: Product[] = [];
    
    // Scrape products from each selected store
    const scrapePromises = stores.map(async (store) => {
      console.log(`Scraping from store: ${store}`);
      switch (store.toLowerCase()) {
        case 'maxipali':
          return await scrapeMaxiPali(searchQuery, category);
        case 'automercado':
          return await scrapeAutomercado(searchQuery, category);
        case 'masxmenos':
          return await scrapeMasXMenos(searchQuery, category);
        case 'pricesmart':
          return await scrapePriceSmart(searchQuery, category);
        default:
          return [];
      }
    });
    
    // Wait for all scraping to complete
    const productsArrays = await Promise.all(scrapePromises);
    
    // Log the number of products found from each store
    productsArrays.forEach((products, index) => {
      console.log(`Found ${products.length} products from ${stores[index]}`);
    });
    
    // Combine all products into a single array
    allProducts = productsArrays.flat();
    console.log(`Total products found: ${allProducts.length}`);
    
    // Return the products as JSON, even if the array is empty
    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

async function scrapeMaxiPali(query: string, category: string = '') {
  try {
    console.log(`Searching MaxiPali for: ${query} in category: ${category}`);
    
    // Use a single, simpler endpoint for testing
    const searchUrl = `https://www.maxipali.co.cr/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?map=ft`;
    
    console.log(`Using simplified endpoint: ${searchUrl}`);
    
    // Headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/',
      'Origin': 'https://www.maxipali.co.cr'
    };
    
    // Make the API call
    const response = await axios.get(searchUrl, { headers })
      .catch(error => {
        console.error(`Error fetching from MaxiPali: ${error.message}`);
        return { data: [] }; // Return empty data on error
      });
    
    // Check if we got a valid response
    if (!response.data || !Array.isArray(response.data)) {
      console.log('MaxiPali returned no valid data');
      return [];
    }
    
    const products = response.data;
    console.log(`MaxiPali returned ${products.length} products`);
    
    // Transform the data to match our Product interface
    const transformedProducts = products.map(item => {
      // Create a unique ID for the product
      const id = item.productId || uuidv4();
      
      // Get the price
      const price = item.items && item.items[0] && item.items[0].sellers && item.items[0].sellers[0]
        ? item.items[0].sellers[0].commertialOffer.Price
        : 0;
      
      // Get the image URL
      const imageUrl = item.items && item.items[0] && item.items[0].images && item.items[0].images[0]
        ? item.items[0].images[0].imageUrl
        : null;
      
      // Extract EAN barcode from the product data
      let ean = '';
      if (item.items && item.items[0] && item.items[0].ean) {
        ean = item.items[0].ean;
      } else if (item.items && item.items[0] && item.items[0].referenceId) {
        // Some stores use referenceId for EAN
        const refId = item.items[0].referenceId.find((ref: any) => ref.Key === 'RefId');
        if (refId) {
          ean = refId.Value;
        }
      }
      
      return {
        id,
        name: item.productName || 'Unknown Product',
        brand: item.brand || 'Unknown Brand',
        description: item.description || '',
        price: price,
        imageUrl: imageUrl,
        store: 'MaxiPali',
        url: item.link || `https://www.maxipali.co.cr/${item.linkText}/p`,
        category: category || 'abarrotes',
        ean: ean || undefined
      };
    });
    
    console.log(`Transformed ${transformedProducts.length} products from MaxiPali`);
    return transformedProducts;
  } catch (error) {
    console.error('Error scraping MaxiPali:', error);
    return [];
  }
}

async function scrapeAutomercado(query: string, category: string = '') {
  try {
    console.log(`Searching Automercado for: ${query}`);
    
    // TODO: Implement actual scraping logic for Automercado
    // For now, return an empty array as we're removing mock products
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
    // For now, return an empty array as we're removing mock products
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
    // For now, return an empty array as we're removing mock products
    return [];
  } catch (error) {
    console.error('Error scraping PriceSmart:', error);
    return [];
  }
}