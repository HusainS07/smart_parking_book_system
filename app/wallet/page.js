'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function Wallet() {
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(0);
  const [topupamnt, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axios.get('/api/wallet/amount');
        const { username, balance } = res.data;
        setUsername(username);
        setBalance(balance);
      } catch (err) {
        toast.error('Error fetching wallet');
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchWallet();
  }, []);

  const handleTopUp = async () => {
    if (!topupamnt || isNaN(topupamnt)) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/wallet/topup', {
        amount: parseFloat(topupamnt),
      });
      toast.success('Top-up request sent! Await admin approval.');
      setTopUpAmount('');
    } catch (err) {
      console.error(err);
      toast.error('Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">💰 Wallet</h2>

        {fetching ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-300 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-slate-300 rounded w-1/3 mx-auto" />
          </div>
        ) : (
          <>
            <div className="text-lg mb-2 text-center">
              <strong className="text-gray-700">Username:</strong> {username}
            </div>
            <div className="text-lg mb-6 text-center">
              <strong className="text-gray-700">Balance:</strong>{' '}
              <span className="text-green-600 font-semibold">₹{balance.toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="space-y-3">
          <input
            type="number"
            value={topupamnt}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Enter amount to top up"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <button
            onClick={handleTopUp}
            disabled={loading}
            className={`w-full py-2 text-white font-semibold rounded-lg transition transform hover:scale-105 ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {loading ? 'Processing...' : 'Top Up'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
