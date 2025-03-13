import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@/types/product';
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

// Function to translate text between languages
async function translateText(text: string, from: string, to: string): Promise<string> {
  try {
    if (!text.trim()) return text;
    
    // For now, let's use a simple dictionary-based translation for common food terms
    // This avoids the complexity of setting up Google Cloud Translation
    const translations: Record<string, Record<string, string>> = {
      en: {
        'rice': 'arroz',
        'milk': 'leche',
        'bread': 'pan',
        'water': 'agua',
        'coffee': 'café',
        'sugar': 'azúcar',
        'salt': 'sal',
        'chicken': 'pollo',
        'beef': 'carne de res',
        'fish': 'pescado',
        'fruit': 'fruta',
        'apple': 'manzana',
        'banana': 'banano',
        'orange': 'naranja',
        'potato': 'papa',
        'tomato': 'tomate',
        'onion': 'cebolla',
        'cheese': 'queso',
        'egg': 'huevo',
        'beans': 'frijoles',
        'corn': 'maíz',
        'flour': 'harina',
        'oil': 'aceite',
        'butter': 'mantequilla',
        'pasta': 'pasta',
        'cereal': 'cereal',
        'yogurt': 'yogur',
        'juice': 'jugo',
        'soda': 'refresco',
        'beer': 'cerveza',
        'wine': 'vino',
        'meat': 'carne',
        'vegetable': 'vegetal',
        'cookie': 'galleta',
        'cake': 'pastel',
        'chocolate': 'chocolate',
        'candy': 'dulce',
        'ice cream': 'helado',
        'soup': 'sopa',
        'sauce': 'salsa',
        'spice': 'especia',
        'herb': 'hierba',
        'tea': 'té',
        'honey': 'miel',
        'jam': 'mermelada',
        'peanut butter': 'mantequilla de maní',
        'tortilla': 'tortilla',
        'chip': 'chip',
        'snack': 'bocadillo',
        'frozen': 'congelado',
        'canned': 'enlatado',
        'fresh': 'fresco',
        'organic': 'orgánico',
        'gluten-free': 'sin gluten',
        'dairy-free': 'sin lácteos',
        'vegan': 'vegano',
        'vegetarian': 'vegetariano'
      },
      es: {
        'arroz': 'rice',
        'leche': 'milk',
        'pan': 'bread',
        'agua': 'water',
        'café': 'coffee',
        'azúcar': 'sugar',
        'sal': 'salt',
        'pollo': 'chicken',
        'carne de res': 'beef',
        'pescado': 'fish',
        'fruta': 'fruit',
        'manzana': 'apple',
        'banano': 'banana',
        'naranja': 'orange',
        'papa': 'potato',
        'tomate': 'tomato',
        'cebolla': 'onion',
        'queso': 'cheese',
        'huevo': 'egg',
        'frijoles': 'beans',
        'maíz': 'corn',
        'harina': 'flour',
        'aceite': 'oil',
        'mantequilla': 'butter',
        'pasta': 'pasta',
        'cereal': 'cereal',
        'yogur': 'yogurt',
        'jugo': 'juice',
        'refresco': 'soda',
        'cerveza': 'beer',
        'vino': 'wine',
        'carne': 'meat',
        'vegetal': 'vegetable',
        'galleta': 'cookie',
        'pastel': 'cake',
        'chocolate': 'chocolate',
        'dulce': 'candy',
        'helado': 'ice cream',
        'sopa': 'soup',
        'salsa': 'sauce',
        'especia': 'spice',
        'hierba': 'herb',
        'té': 'tea',
        'miel': 'honey',
        'mermelada': 'jam',
        'mantequilla de maní': 'peanut butter',
        'tortilla': 'tortilla',
        'chip': 'chip',
        'bocadillo': 'snack',
        'congelado': 'frozen',
        'enlatado': 'canned',
        'fresco': 'fresh',
        'orgánico': 'organic',
        'sin gluten': 'gluten-free',
        'sin lácteos': 'dairy-free',
        'vegano': 'vegan',
        'vegetariano': 'vegetarian'
      }
    };
    
    // Simple word-by-word translation
    const sourceLanguage = from === 'en' ? 'en' : 'es';
    const targetLanguage = to === 'en' ? 'en' : 'es';
    
    // Split the text into words and translate each one
    const words = text.toLowerCase().split(/\s+/);
    const translatedWords = words.map(word => {
      const dictionary = translations[sourceLanguage];
      return dictionary[word] || word;
    });
    
    return translatedWords.join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
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

    // Search in each selected store with both queries
    for (const store of stores) {
      console.log(`Searching in ${store.charAt(0).toUpperCase() + store.slice(1)}...`);
      
      let storeProducts: Product[] = [];
      
      // Search with Spanish query
      const spanishProducts = await searchStore(store, spanishQuery, category);
      
      // Search with English query
      const englishProducts = await searchStore(store, englishQuery, category);
      
      // Merge results, removing duplicates based on product ID
      storeProducts = [...spanishProducts, ...englishProducts]
        .filter((product, index, self) => 
          index === self.findIndex((p) => p.id === product.id)
        );
      
      // Add translated names to products
      storeProducts = await Promise.all(storeProducts.map(async (product) => {
        const translatedName = language === 'en' 
          ? await translateText(product.name, 'es', 'en')
          : await translateText(product.name, 'en', 'es');
        
        return {
          ...product,
          translatedName
        };
      }));
      
      console.log(`Found ${storeProducts.length} products from ${store}`);
      allProducts = [...allProducts, ...storeProducts];
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