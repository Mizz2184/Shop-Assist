# Shop Assist

A modern grocery store product scraper app that allows you to search for products from multiple stores and create a grocery list.

## Features

- Search for products from Maxi Pali, Automercado, Mas x Menos, and PriceSmart
- View product details including name, brand, description, price, and image
- Filter search results by store
- Add products to your grocery list
- View and manage your grocery list

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- Supabase for database
- Axios and Cheerio for web scraping

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shop-assist.git
   cd shop-assist
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rcmuzstcirbulftnbcth.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the Supabase database:
   - Create a new table called `grocery_list` with the following schema:
     ```sql
     create table grocery_list (
       id uuid primary key,
       name text not null,
       brand text,
       description text,
       price numeric not null,
       imageUrl text,
       store text not null,
       url text,
       created_at timestamp with time zone default now()
     );
     ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Use the search bar to search for products
2. Filter results by selecting/deselecting stores
3. Click "Add to list" on any product to add it to your grocery list
4. View your grocery list by clicking "Grocery List" in the navigation
5. Remove items from your grocery list by clicking the trash icon

## Notes

- The current implementation uses mock data for demonstration purposes
- In a production environment, you would need to implement actual web scraping logic for each store
- Be aware of the terms of service for each website when implementing web scraping

## License

This project is licensed under the MIT License - see the LICENSE file for details. # Shop-Assist
