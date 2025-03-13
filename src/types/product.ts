export interface Product {
  id: string;
  name: string;
  translatedName?: string; // Name in the other language (English/Spanish)
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
  created_at?: string;
} 