import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SlotDetailClient from './SlotDetailClient';

// Metadata for SEO on the slot detail page
export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Book Slot ${id} | Parking Slot Booking`,
    description: `Select a date and hourly time slot to book parking space ${id} online.`,
  };
}

export default async function SlotDetailPage({ params }) {
  const { id } = await params; // slot UUID
  const session = await getServerSession(authOptions);
  
  // Fetch slot details using parameterized query (UUID search)
  const slotRes = await query(
    `SELECT
       ps.id, ps.slotid, ps.amount, ps.allotted, ps.location,
       ps.is_approved AS "isApproved", ps.lot_id, ps.created_at AS "createdAt",
       pl.lot_name AS "lotName", pl.address, pl.city
     FROM parking_slots ps
     LEFT JOIN parking_lots pl ON ps.lot_id = pl.id
     WHERE ps.id = $1 AND ps.is_approved = true`,
    [id]
  );
  
  if (slotRes.rowCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-sm">
          <p className="text-red-500 text-lg font-bold">Slot Not Found</p>
          <p className="text-gray-500 mt-2 text-sm">The parking slot you are trying to access does not exist or has not been approved yet.</p>
        </div>
      </div>
    );
  }
  
  const slot = slotRes.rows[0];
  let wallet = 0;
  
  if (session?.user?.email) {
    try {
      const walletRes = await query('SELECT balance FROM wallets WHERE email = $1', [session.user.email]);
      if (walletRes.rowCount > 0) {
        wallet = parseFloat(walletRes.rows[0].balance);
      }
    } catch (err) {
      console.error('Failed to fetch wallet for detail page server-side:', err);
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-blue-50 py-12">
      <SlotDetailClient
        slot={{
          _id: slot.id,
          slotid: slot.slotid,
          amount: parseFloat(slot.amount),
          alloted: slot.allotted,
          location: slot.location,
          isApproved: slot.isApproved,
          createdAt: slot.createdAt,
          lotId: slot.lot_id ? { _id: slot.lot_id, lotName: slot.lotName, address: slot.address, city: slot.city } : null,
        }}
        initialWallet={wallet}
        session={session}
      />
    </div>
  );
}
