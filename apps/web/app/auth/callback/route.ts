import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  // In local SQLite mode, there is no OAuth callback to process.
  // Redirect to home.
  return NextResponse.redirect(`${origin}/`);
}
