import { NextResponse } from 'next/server';

// Simple health check that works in Edge Runtime
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}