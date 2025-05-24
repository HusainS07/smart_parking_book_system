"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminTopUpPage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get("/api/admin/topup-requests").then(res => {
      setRequests(res.data);
    });
  }, []);

  const handleAction = async (id, action) => {
    const res = await axios.post("/api/admin/topup-requests", { id, action });
    if (res.data.success) {
      setRequests(prev => prev.filter(r => r._id !== id));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Top-Up Requests</h1>
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
                onClick={() => handleAction(req._id, "accept")}
                className="bg-green-500 text-white px-4 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(req._id, "reject")}
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
