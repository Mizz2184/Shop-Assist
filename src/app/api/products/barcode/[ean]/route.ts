import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@/types/product';

export async function GET(
  request: NextRequest,
  context: { params: { ean: string } }
): Promise<NextResponse> {
  try {
    const { ean } = context.params;

    // Prepare the MaxiPali API parameters
    const apiParams = {
      'workspace': 'master',
      'maxAge': 'short',
      'appsEtag': 'remove',
      'domain': 'store',
      'locale': 'es-CR',
      '__bindingId': 'c0655441-0e36-4c40-a5b2-167f32bcfd18',
      'operationName': 'productSearchV3',
      'variables': '{}',
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjIiwicXVlcnkiOiIke3F1ZXJ5fSIsIm9yZGVyQnkiOiJPcmRlckJ5U2NvcmVERVNDIiwiZnJvbSI6MCwidG8iOjIwLCJzZWxlY3RlZEZhY2V0cyI6W3sia2V5IjoiYyIsInZhbHVlIjoiYWJhcnJvdGVzIn1dLCJvcGVyYXRvciI6ImFuZCIsImZ1enp5IjoiMCIsInNlYXJjaFN0YXRlIjpudWxsLCJmYWNldHNCZWhhdmlvciI6IlN0YXRpYyIsImNhdGVnb3J5VHJlZUJlaGF2aW9yIjoiZGVmYXVsdCIsIndpdGhGYWNldHMiOmZhbHNlLCJhZHZlcnRpc2VtZW50T3B0aW9ucyI6eyJzaG93U3BvbnNvcmVkIjp0cnVlLCJzcG9uc29yZWRDb3VudCI6MywiYWR2ZXJ0aXNlbWVudFBsYWNlbWVudCI6InRvcF9zZWFyY2giLCJyZXBlYXRTcG9uc29yZWRQcm9kdWN0cyI6dHJ1ZX19"}`.replace('${query}', ''),
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
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }

    // Find the product with matching EAN
    const products = response.data.data.productSearch.products;
    const matchingProduct = products.find((item: any) => {
      let productEan = '';
      if (item.items?.[0]?.ean) {
        productEan = item.items[0].ean;
      } else if (item.items?.[0]?.referenceId) {
        const refId = item.items[0].referenceId.find((ref: any) => ref.Key === 'RefId');
        if (refId) {
          productEan = refId.Value;
        }
      }
      return productEan === ean;
    });

    if (!matchingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Transform the matching product into our Product type
    const price = matchingProduct.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
    const imageUrl = matchingProduct.items?.[0]?.images?.[0]?.imageUrl || null;

    const product: Product = {
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

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error in barcode search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 