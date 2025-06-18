'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [pendingLots, setPendingLots] = useState([]);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    const fetchPendingLots = async () => {
      try {
        const res = await axios.get('/api/admin/lots/pending');
        setPendingLots(res.data);
      } catch (err) {
        console.error('Failed to load pending lots:', err);
      }
    };

    if (isAdmin) {
      fetchPendingLots();
    }
  }, [isAdmin]);

  const handleApprove = async (lotId) => {
    try {
      await axios.post('/api/admin/lots/approve', { lotId });
      setPendingLots((prev) => prev.filter((lot) => lot._id !== lotId));
    } catch (err) {
      console.error('Failed to approve lot:', err);
    }
  };

  const handleReject = async (lotId) => {
    try {
      await axios.post('/api/admin/lots/reject', { lotId });
      setPendingLots((prev) => prev.filter((lot) => lot._id !== lotId));
    } catch (err) {
      console.error('Failed to reject lot:', err);
    }
  };

  if (status === 'loading') return <p>Loading...</p>;

  if (!session || !isAdmin) return <p className="text-center mt-20">Access denied</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛠️ Pending Parking Lot Requests</h1>
        <button onClick={() => signOut()} className="text-red-500">Logout</button>
      </div>

      {pendingLots.length === 0 ? (
        <p>No pending lots.</p>
      ) : (
        pendingLots.map((lot) => (
          <div key={lot._id} className="border p-4 rounded-md mb-4">
            <h2 className="font-semibold text-lg">{lot.lotName}</h2>
            <p>📍 {lot.location?.address}</p>
            <p>🅿️ Spots: {lot.totalSpots}</p>
            <p>💸 Price/Hour: ₹{lot.pricePerHour}</p>
            <div className="mt-2 space-x-4">
              <button onClick={() => handleApprove(lot._id)} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
              <button onClick={() => handleReject(lot._id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
