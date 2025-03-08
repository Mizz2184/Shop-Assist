import { NextRequest, NextResponse } from 'next/server';

// Simple dictionary for common Spanish to English translations
// In a real app, you would use a proper translation API like Google Translate
const translations: Record<string, string> = {
  // Store names
  'maxipali': 'MaxiPali',
  'automercado': 'Auto Mercado',
  'masxmenos': 'Mas x Menos',
  'pricesmart': 'PriceSmart',
  'walmart': 'Walmart',
  'pequeño mundo': 'Pequeño Mundo',
  'universal': 'Universal',
  'perimercados': 'Perimercados',
  'mega super': 'Mega Super',

  // Product categories
  'abarrotes': 'groceries',
  'bebidas': 'beverages',
  'lácteos': 'dairy',
  'carnes': 'meats',
  'frutas y verduras': 'fruits and vegetables',
  'panadería': 'bakery',
  'limpieza': 'cleaning',
  'cuidado personal': 'personal care',
  'hogar': 'home',
  'mascotas': 'pets',
  'bebés': 'babies',
  'electrónicos': 'electronics',
  'ropa': 'clothing',
  'juguetes': 'toys',
  'deportes': 'sports',
  'ferretería': 'hardware',
  'jardín': 'garden',
  'automotriz': 'automotive',
  'farmacia': 'pharmacy',
  'licores': 'liquor',
  'congelados': 'frozen',
  'snacks': 'snacks',
  'dulces': 'candy',
  'orgánicos': 'organic',
  'sin gluten': 'gluten-free',
  'vegano': 'vegan',
  'vegetariano': 'vegetarian',
  'sin azúcar': 'sugar-free',
  'sin lactosa': 'lactose-free',
  'bajo en sodio': 'low sodium',
  'bajo en grasa': 'low fat',
  'alto en proteína': 'high protein',
  'importado': 'imported',
  'nacional': 'national',
  'oferta': 'sale',
  'descuento': 'discount',
  'nuevo': 'new',
  'popular': 'popular',
  'recomendado': 'recommended',
  'exclusivo': 'exclusive',
  'limitado': 'limited',
  'temporada': 'seasonal',
  'orgánico': 'organic',
  'natural': 'natural',
  'fresco': 'fresh',
  'congelado': 'frozen',
  'enlatado': 'canned',
  'empacado': 'packaged',
  'granel': 'bulk',
  'unidad': 'unit',
  'paquete': 'package',
  'caja': 'box',
  'botella': 'bottle',
  'lata': 'can',
  'bolsa': 'bag',
  'kilo': 'kilo',
  'gramo': 'gram',
  'litro': 'liter',
  'mililitro': 'milliliter',
  'onza': 'ounce',
  'libra': 'pound',
  'galón': 'gallon',
  'docena': 'dozen',

  // Common product terms
  'arroz': 'rice',
  'atun': 'tuna',
  'atún': 'tuna',
  'leche': 'milk',
  'pan': 'bread',
  'queso': 'cheese',
  'pollo': 'chicken',
  'carne': 'meat',
  'pescado': 'fish',
  'frutas': 'fruits',
  'verduras': 'vegetables',
  'aceite': 'oil',
  'azucar': 'sugar',
  'azúcar': 'sugar',
  'sal': 'salt',
  'agua': 'water',
  'jugo': 'juice',
  'cafe': 'coffee',
  'café': 'coffee',
  'te': 'tea',
  'té': 'tea',
  'cerveza': 'beer',
  'vino': 'wine',
  'pasta': 'pasta',
  'frijoles': 'beans',
  'huevos': 'eggs',
  'mantequilla': 'butter',
  'yogurt': 'yogurt',
  'chocolate': 'chocolate',
  'galletas': 'cookies',
  'cereal': 'cereal',
  'salsa': 'sauce',
  'sopa': 'soup',
  'helado': 'ice cream',
  'manzana': 'apple',
  'banana': 'banana',
  'naranja': 'orange',
  'limón': 'lemon',
  'tomate': 'tomato',
  'papa': 'potato',
  'cebolla': 'onion',
  'ajo': 'garlic',
  'zanahoria': 'carrot',
  'lechuga': 'lettuce',
  'piña': 'pineapple',
  'sandía': 'watermelon',
  'melón': 'melon',
  'uva': 'grape',
  'fresa': 'strawberry',
  'aguacate': 'avocado',
  'pepino': 'cucumber',
  'pimiento': 'pepper',
  'maíz': 'corn',
  'jamón': 'ham',
  'salchicha': 'sausage',
  'tocino': 'bacon',
  'pavo': 'turkey',
  'res': 'beef',
  'cerdo': 'pork',
  'cordero': 'lamb',
  'camarón': 'shrimp',
  'salmón': 'salmon',
  'sardina': 'sardine',
  
  // Common brand terms
  'marca': 'brand',
  'precio': 'price',
  'tienda': 'store',
  'producto': 'product',
  'descripción': 'description',
  'añadir': 'add',
  'lista': 'list',
  'compras': 'shopping',
  'buscar': 'search',
  'resultados': 'results',
  'volver': 'back',
  'eliminar': 'remove',
  'guardar': 'save',
  'editar': 'edit',
  'compartir': 'share',
  'favorito': 'favorite',
  'calificación': 'rating',
  'comentario': 'comment',
  'reseña': 'review',
  'disponible': 'available',
  'agotado': 'sold out',
  'en stock': 'in stock',
  'cantidad': 'quantity',
  'total': 'total',
  'subtotal': 'subtotal',
  'impuesto': 'tax',
  'envío': 'shipping',
  'entrega': 'delivery',
  'recogida': 'pickup',
  'dirección': 'address',
  'pago': 'payment',
  'tarjeta': 'card',
  'efectivo': 'cash',
  'transferencia': 'transfer',
  'factura': 'invoice',
  'recibo': 'receipt',
  'pedido': 'order',
  'historial': 'history',
  'cuenta': 'account',
  'perfil': 'profile',
  'configuración': 'settings',
  'ayuda': 'help',
  'contacto': 'contact',
  'información': 'information',
  'términos': 'terms',
  'privacidad': 'privacy',
  'política': 'policy',
  'condiciones': 'conditions',
  'servicio': 'service',
  'cliente': 'customer',
  'usuario': 'user',
  'contraseña': 'password',
  'iniciar sesión': 'login',
  'registrarse': 'register',
  'cerrar sesión': 'logout',
  'olvidé mi contraseña': 'forgot my password',
  'recordarme': 'remember me',
  'verificación': 'verification',
  'código': 'code',
  'confirmar': 'confirm',
  'cancelar': 'cancel',
  'continuar': 'continue',
  'finalizar': 'finish',
  'siguiente': 'next',
  'anterior': 'previous',
  'primero': 'first',
  'último': 'last',
  'más': 'more',
  'menos': 'less',
  'todo': 'all',
  'nada': 'nothing',
  'sí': 'yes',
  'no': 'no',
  'aceptar': 'accept',
  'rechazar': 'reject',
  'aplicar': 'apply',
  'filtrar': 'filter',
  'ordenar': 'sort',
  'ascendente': 'ascending',
  'descendente': 'descending',
  'desde': 'from',
  'hasta': 'to',
  'entre': 'between',
  'con': 'with',
  'sin': 'without',
  'y': 'and',
  'o': 'or',
  'de': 'of',
  'en': 'in',
  'para': 'for',
  'por': 'by',
};

export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();
    
    // Return empty string if text is empty or null
    if (!text || text.trim() === '') {
      return NextResponse.json({ translatedText: '' });
    }
    
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Simple translation using the dictionary
    if (from === 'es' && to === 'en') {
      // Split the text into words and translate each word
      const words = text.split(/\s+/);
      const translatedWords = words.map((word: string) => {
        // Remove punctuation for lookup
        const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        // Use the translation if available, otherwise use the original word
        return translations[cleanWord] || word;
      });
      
      return NextResponse.json({ translatedText: translatedWords.join(' ') });
    } else if (from === 'en' && to === 'es') {
      // For English to Spanish, we'll do a reverse lookup
      // This is not efficient but works for a small dictionary
      const words = text.split(/\s+/);
      const translatedWords = words.map((word: string) => {
        // Remove punctuation for lookup
        const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        
        // Find the Spanish word that translates to this English word
        for (const [spanish, english] of Object.entries(translations)) {
          if (english.toLowerCase() === cleanWord) {
            return spanish;
          }
        }
        
        // If no translation found, return the original word
        return word;
      });
      
      return NextResponse.json({ translatedText: translatedWords.join(' ') });
    } else {
      // Unsupported language pair
      return NextResponse.json(
        { error: 'Unsupported language pair' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
} 