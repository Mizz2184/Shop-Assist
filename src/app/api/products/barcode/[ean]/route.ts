// @ts-nocheck
import { NextResponse } from 'next/server';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@/types/product';

// EAN validation function
function isValidEAN(ean) {
  // Basic format check (EAN-13, EAN-8, UPC-A, UPC-E)
  if (!/^(\d{8}|\d{12,14})$/.test(ean)) {
    return false;
  }
  
  // For EAN-13, verify the check digit
  if (ean.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(ean[12]) === checkDigit;
  }
  
  return true; // Other formats pass basic length check
}

export async function GET(
  req,
  { params }
) {
  try {
    const ean = params.ean;

    if (!ean || ean.length < 8) {
      return NextResponse.json({ 
        error: 'Invalid barcode. EAN must be at least 8 digits.' 
      }, { status: 400 });
    }

    // Validate EAN format and check digit
    if (!isValidEAN(ean)) {
      return NextResponse.json({ 
        error: 'Invalid barcode format or check digit' 
      }, { status: 400 });
    }

    // First try to search directly using the EAN as a query
    const product = await searchByEanAsQuery(ean);
    
    if (product) {
      return NextResponse.json(product);
    }
    
    // If direct search fails, try the general product search
    const generalProduct = await searchInGeneralProducts(ean);
    
    if (generalProduct) {
      return NextResponse.json(generalProduct);
    }
    
    // If both methods fail, return not found
    return NextResponse.json({ 
      error: 'Product not found with this barcode' 
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error in barcode search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to search directly using the EAN as a query
async function searchByEanAsQuery(ean) {
  try {
    // Prepare the MaxiPali API parameters with the EAN as the query
    const apiParams = {
      'workspace': 'master',
      'maxAge': 'short',
      'appsEtag': 'remove',
      'domain': 'store',
      'locale': 'es-CR',
      '__bindingId': 'c0655441-0e36-4c40-a5b2-167f32bcfd18',
      'operationName': 'productSearchV3',
      'variables': '{}',
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjIiwicXVlcnkiOiIke3F1ZXJ5fSIsIm9yZGVyQnkiOiJPcmRlckJ5U2NvcmVERVNDIiwiZnJvbSI6MCwidG8iOjIwLCJzZWxlY3RlZEZhY2V0cyI6W3sia2V5IjoiYyIsInZhbHVlIjoiYWJhcnJvdGVzIn1dLCJvcGVyYXRvciI6ImFuZCIsImZ1enp5IjoiMCIsInNlYXJjaFN0YXRlIjpudWxsLCJmYWNldHNCZWhhdmlvciI6IlN0YXRpYyIsImNhdGVnb3J5VHJlZUJlaGF2aW9yIjoiZGVmYXVsdCIsIndpdGhGYWNldHMiOmZhbHNlLCJhZHZlcnRpc2VtZW50T3B0aW9ucyI6eyJzaG93U3BvbnNvcmVkIjp0cnVlLCJzcG9uc29yZWRDb3VudCI6MywiYWR2ZXJ0aXNlbWVudFBsYWNlbWVudCI6InRvcF9zZWFyY2giLCJyZXBlYXRTcG9uc29yZWRQcm9kdWN0cyI6dHJ1ZX19"}`.replace('${query}', ean),
    };

    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/',
      'Origin': 'https://www.maxipali.co.cr'
    };

    // Make the API request to MaxiPali
    const response = await axios.get('https://www.maxipali.co.cr/_v/segment/graphql/v1', {
      params: apiParams,
      headers,
      timeout: 10000
    });

    if (!response.data?.data?.productSearch?.products || response.data.data.productSearch.products.length === 0) {
      return null;
    }

    // Get the first product from the results
    const matchingProduct = response.data.data.productSearch.products[0];
    
    // Verify that the product has the correct EAN
    let productEan = '';
    if (matchingProduct.items?.[0]?.ean) {
      productEan = matchingProduct.items[0].ean;
    } else if (matchingProduct.items?.[0]?.referenceId) {
      const refId = matchingProduct.items[0].referenceId.find((ref) => ref.Key === 'RefId');
      if (refId) {
        productEan = refId.Value;
      }
    }
    
    // Only return the product if the EAN matches exactly
    if (productEan === ean) {
      return transformProduct(matchingProduct, ean);
    }
    
    return null;
  } catch (error) {
    console.error('Error in direct EAN search:', error);
    return null;
  }
}

// Function to search in general products
async function searchInGeneralProducts(ean) {
  try {
    // Prepare the MaxiPali API parameters for a general search
    const apiParams = {
      'workspace': 'master',
      'maxAge': 'short',
      'appsEtag': 'remove',
      'domain': 'store',
      'locale': 'es-CR',
      '__bindingId': 'c0655441-0e36-4c40-a5b2-167f32bcfd18',
      'operationName': 'productSearchV3',
      'variables': '{}',
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjIiwicXVlcnkiOiIke3F1ZXJ5fSIsIm9yZGVyQnkiOiJPcmRlckJ5U2NvcmVERVNDIiwiZnJvbSI6MCwidG8iOjUwLCJzZWxlY3RlZEZhY2V0cyI6W3sia2V5IjoiYyIsInZhbHVlIjoiYWJhcnJvdGVzIn1dLCJvcGVyYXRvciI6ImFuZCIsImZ1enp5IjoiMCIsInNlYXJjaFN0YXRlIjpudWxsLCJmYWNldHNCZWhhdmlvciI6IlN0YXRpYyIsImNhdGVnb3J5VHJlZUJlaGF2aW9yIjoiZGVmYXVsdCIsIndpdGhGYWNldHMiOmZhbHNlLCJhZHZlcnRpc2VtZW50T3B0aW9ucyI6eyJzaG93U3BvbnNvcmVkIjp0cnVlLCJzcG9uc29yZWRDb3VudCI6MywiYWR2ZXJ0aXNlbWVudFBsYWNlbWVudCI6InRvcF9zZWFyY2giLCJyZXBlYXRTcG9uc29yZWRQcm9kdWN0cyI6dHJ1ZX19"}`.replace('${query}', ''),
    };

    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/',
      'Origin': 'https://www.maxipali.co.cr'
    };

    // Make the API request to MaxiPali
    const response = await axios.get('https://www.maxipali.co.cr/_v/segment/graphql/v1', {
      params: apiParams,
      headers,
      timeout: 10000
    });

    if (!response.data?.data?.productSearch?.products) {
      return null;
    }

    // Find the product with matching EAN
    const products = response.data.data.productSearch.products;
    const matchingProduct = products.find((item) => {
      let productEan = '';
      if (item.items?.[0]?.ean) {
        productEan = item.items[0].ean;
      } else if (item.items?.[0]?.referenceId) {
        const refId = item.items[0].referenceId.find((ref) => ref.Key === 'RefId');
        if (refId) {
          productEan = refId.Value;
        }
      }
      return productEan === ean;
    });

    if (!matchingProduct) {
      return null;
    }

    return transformProduct(matchingProduct, ean);
  } catch (error) {
    console.error('Error in general product search:', error);
    return null;
  }
}

// Function to transform a product from the API to our Product type
function transformProduct(matchingProduct, ean) {
  const price = matchingProduct.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
  const imageUrl = matchingProduct.items?.[0]?.images?.[0]?.imageUrl || null;

  return {
    id: matchingProduct.productId || uuidv4(),
    name: matchingProduct.productName || 'Unknown Product',
    brand: matchingProduct.brand || 'Unknown Brand',
    description: matchingProduct.description || '',
    price: price,
    imageUrl: imageUrl || 'https://placehold.co/400x400?text=No+Image',
    store: 'MaxiPali',
    url: matchingProduct.link || `https://www.maxipali.co.cr/${matchingProduct.linkText}/p`,
    category: 'abarrotes',
    ean: ean
  };
} 