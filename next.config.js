/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.maxipali.co.cr',
      },
      {
        protocol: 'https',
        hostname: '**.automercado.cr',
      },
      {
        protocol: 'https',
        hostname: '**.masxmenos.cr',
      },
      {
        protocol: 'https',
        hostname: '**.pricesmart.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.vtexassets.com',
      },
      {
        protocol: 'https',
        hostname: 'bodegacr.vtexassets.com',
      },
      {
        protocol: 'https',
        hostname: 'maxipali.vtexassets.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'walmartcr.vteximg.com.br',
      },
      {
        protocol: 'https',
        hostname: '**.vteximg.com.br',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
    ],
  },
  env: {
    LOOPS_API_KEY: process.env.LOOPS_API_KEY,
    LOOPS_INVITATION_TRANSACTIONAL_ID: process.env.LOOPS_INVITATION_TRANSACTIONAL_ID,
    NEXT_PUBLIC_LOOPS_API_KEY: process.env.NEXT_PUBLIC_LOOPS_API_KEY,
    NEXT_PUBLIC_LOOPS_INVITATION_TRANSACTIONAL_ID: process.env.NEXT_PUBLIC_LOOPS_INVITATION_TRANSACTIONAL_ID,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 