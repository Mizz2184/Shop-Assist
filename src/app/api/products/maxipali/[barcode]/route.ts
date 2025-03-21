import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { barcode: string } }
) {
  const barcode = params.barcode;

  try {
    // Maxi Pali API endpoint
    const apiUrl = `https://api.maxipali.com/products/lookup/${barcode}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.MAXIPALI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Maxi Pali API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product data' },
      { status: 500 }
    );
  }
}