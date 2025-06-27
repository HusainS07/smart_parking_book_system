'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [pendingLots, setPendingLots] = useState([]);
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' or 'topup'

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    async function fetchPendingLots() {
      try {
        const res = await axios.get('/api/admin/lots/pending', {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setPendingLots(res.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load pending lots:', err);
        setError(err.response?.data?.error || 'Failed to load pending lots');
      }
    }

    async function fetchTopUpRequests() {
      try {
        const res = await axios.get('/api/admin/topup-requests', {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setTopUpRequests(res.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load top-up requests:', err);
        setError(err.response?.data?.error || 'Failed to load top-up requests');
      }
    }

    if (isAdmin) {
      fetchPendingLots();
      fetchTopUpRequests();
    }
  }, [isAdmin]);

  const handleApproveLot = async (lotId) => {
    try {
      await axios.post('/api/slots/create', { lotId }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      setPendingLots((prev) => prev.filter((lot) => lot._id !== lotId));
      setError(null);
    } catch (err) {
      console.error('Failed to approve lot:', err);
      setError(err.response?.data?.error || 'Failed to approve lot');
    }
  };

  const handleRejectLot = async (lotId) => {
    try {
      await axios.post('/api/lots/reject', { lotId }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      setPendingLots((prev) => prev.filter((lot) => lot._id !== lotId));
      setError(null);
    } catch (err) {
      console.error('Failed to reject lot:', err);
      setError(err.response?.data?.error || 'Failed to reject lot');
    }
  };

  const handleTopUpAction = async (id, action) => {
    try {
      const res = await axios.put('/api/admin/topup-requests', { id, action }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      if (res.data.success) {
        setTopUpRequests((prev) => prev.filter((req) => req._id !== id));
        setError(null);
      }
    } catch (err) {
      console.error('Failed to update top-up request:', err);
      setError(err.response?.data?.error || 'Failed to update top-up request');
    }
  };

  if (status === 'loading') return <p className="text-center mt-20">Loading...</p>;
  if (!session || !isAdmin) return <p className="text-center mt-20 text-red-500">Access denied</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🛠️ Admin Dashboard</h1>
          <button onClick={() => signOut()} className="text-red-500 hover:text-red-700 font-semibold">
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'lots' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            onClick={() => setActiveTab('lots')}
          >
            Pending Lots
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'topup' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            onClick={() => setActiveTab('topup')}
          >
            Wallet Top-Up Requests
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Pending Lots Tab */}
        {activeTab === 'lots' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">🅿️ Pending Parking Lots</h2>
            {pendingLots.length === 0 ? (
              <p className="text-gray-500">No pending lots.</p>
            ) : (
              pendingLots.map((lot) => (
                <div key={lot._id} className="border p-4 rounded-md mb-4 shadow-sm bg-white">
                  <h3 className="font-semibold text-lg">{lot.lotName}</h3>
                  <p>📍 {lot.address}</p>
                  <p>🌆 City: {lot.city}</p>
                  <p>🅿️ Spots: {lot.totalSpots}</p>
                  <p>💸 Price/Hour: ₹{lot.pricePerHour}</p>
                  <div className="mt-3 space-x-3">
                    <button
                      onClick={() => handleApproveLot(lot._id)}
                      className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLot(lot._id)}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wallet Top-Up Requests Tab */}
        {activeTab === 'topup' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">💳 Pending Top-Up Requests</h2>
            {topUpRequests.length === 0 ? (
              <p className="text-gray-500">No pending requests</p>
            ) : (
              topUpRequests.map((req) => (
                <div key={req._id} className="border p-4 rounded-md mb-4 shadow-sm bg-white">
                  <p><strong>User:</strong> {req.username}</p>
                  <p><strong>Amount:</strong> ₹{req.amount}</p>
                  <p><strong>Wallet ID:</strong> {req.walletid?._id}</p>
                  <p><strong>Created:</strong> {new Date(req.createdAt).toLocaleString()}</p>
                  <div className="mt-3 space-x-3">
                    <button
                      onClick={() => handleTopUpAction(req._id, 'approve')}
                      className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleTopUpAction(req._id, 'reject')}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}