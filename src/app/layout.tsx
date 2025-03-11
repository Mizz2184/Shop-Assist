import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shop Assist - Grocery Store Product Scraper',
  description: 'Find and compare products from Maxi Pali, Automercado, Mas x Menos, and PriceSmart',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ isolation: 'isolate' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 