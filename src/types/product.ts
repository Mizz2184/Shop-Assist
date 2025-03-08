export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  imageUrl: string;
  store: string;
  ean?: string; // EAN barcode (optional since not all products may have it)
  category: string;
  subcategory?: string;
  unit?: string;
  quantity?: number;
  isAdded?: boolean;
  url: string;
  isMockProduct?: boolean;
} 