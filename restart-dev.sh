#!/bin/bash

# Kill any running Next.js processes
echo "Stopping any running Next.js processes..."
pkill -f "node.*next"

# Clear Node.js cache
echo "Clearing Next.js cache..."
rm -rf .next/cache

# Clear browser caches in Chrome/Safari (optional)
echo "You may want to clear your browser cache manually as well"

# Start the development server with increased memory
echo "Starting development server with increased memory..."
export NODE_OPTIONS="--max-old-space-size=8192"
npm run dev
