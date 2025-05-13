import { NextResponse } from 'next/server';

// This middleware is no longer needed as we've implemented our own API endpoints
export async function middleware(request) {
  // For all routes, let Next.js handle it
  return NextResponse.next();
}

// Keep the matcher for reference, but it won't rewrite anything anymore
export const config = {
  matcher: ['/api/devices', '/api/devices/:path*'],
}; 