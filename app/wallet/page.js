"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Wallet() {
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);
  const [topupamnt, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch wallet info
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axios.get("/api/wallet");
        const { username, balance } = res.data;
        setUsername(username);
        setBalance(balance);
      } catch (err) {
        console.error("Error fetching wallet:", err);
      }
    };
    fetchWallet();
  }, []);

  // Handle top-up request
  const handleTopUp = async () => {
    if (!topupamnt || isNaN(topupamnt)) return;

    try {
      setLoading(true);
      const res = await axios.post("/api/wallet/topup", {
        amount: parseFloat(topupamnt),
      });
      setMessage("Top-up request sent! Await admin approval.");
      setTopUpAmount("");
    } catch (err) {
      console.error("Top-up failed:", err);
      setMessage("Failed to send top-up request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-12 p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-5">
      <h2 className="text-2xl font-semibold text-center">Wallet</h2>
      <p>
        <strong>Username:</strong> {username}
      </p>
      <p>
        <strong>Balance:</strong> ₹{balance.toFixed(2)}
      </p>

      <div>
        <input
          type="number"
          value={topupamnt}
          onChange={(e) => setTopUpAmount(e.target.value)}
          placeholder="Enter amount to top up"
          className="border p-2 rounded w-full"
        />
        <div className="flex justify-center">
          <button
            onClick={handleTopUp}
            className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Processing..." : "Top Up"}
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-green-600 text-center">{message}</p>}
    </div>
  );
}
