'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';

export default function AdminTopUpPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState([]);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      axios.get('/api/admin/topup-requests').then(res => {
        setRequests(res.data);
      }).catch(err => {
        console.error('Failed to load top-up requests:', err);
      });
    }
  }, [isAdmin]);

  const handleAction = async (id, action) => {
    try {
      const res = await axios.put('/api/admin/topup-requests', { id, action });
      if (res.data.success) {
        setRequests(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    }
  };

  if (status === 'loading') return <p>Loading...</p>;
  if (!session || !isAdmin) return <p className="text-center mt-20">Access denied</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💳 Pending Top-Up Requests</h1>
        <button onClick={() => signOut()} className="text-red-500">Logout</button>
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-500">No pending requests</p>
      ) : (
        requests.map(req => (
          <div key={req._id} className="border rounded p-4 mb-4 shadow-sm">
            <p><strong>User:</strong> {req.username}</p>
            <p><strong>Amount:</strong> ₹{req.amount}</p>
            <p><strong>Wallet ID:</strong> {req.walletid?._id}</p>
            <p><strong>Created:</strong> {new Date(req.createdAt).toLocaleString()}</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => handleAction(req._id, 'approve')}
                className="bg-green-500 text-white px-4 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(req._id, 'reject')}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
