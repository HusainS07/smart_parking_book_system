import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import startPaymentWorkers from '@/lib/paymentWorker';

export const maxDuration = 300; // 5 minutes

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start the workers
    startPaymentWorkers();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment workers started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting payment workers:', error);
    return NextResponse.json({ 
      error: 'Failed to start payment workers',
      details: error.message 
    }, { status: 500 });
  }
}