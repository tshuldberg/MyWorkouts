import { NextResponse, type NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // No Supabase session management needed with local SQLite auth.
  // Pass all requests through unchanged.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
