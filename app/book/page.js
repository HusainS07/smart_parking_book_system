'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function BookingPage() {
  const { data: session, status } = useSession();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [location, setLocation] = useState('mumbai');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Fetch slots on location change
  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/slots?location=${location}`);
        setSlots(res.data);
      } catch (error) {
        console.error('Failed to fetch slots:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [location]);

  // Fetch wallet balance
  useEffect(() => {
    async function fetchWallet() {
      if (session?.user) {
        try {
          const res = await axios.get(`/api/wallet?username=${session.user.name}`);
          setWallet(res.data.balance);
        } catch (err) {
          console.error("Wallet fetch error:", err);
        }
      }
    }

    fetchWallet();
  }, [session]);

  // ✅ Wallet Booking Logic
  const handleWalletBooking = async (slot) => {
    if (!session?.user) return alert("Please log in.");

    if (wallet >= slot.amount) {
      try {
        const res = await axios.post("/api/wallet/deduct", {
          username: session.user.name,
          amount: slot.amount,
        });

        await axios.post("/api/slots/book", {
          slotid: slot.slotid,
          bookedby: session.user.email,
        });

        // ✅ Update wallet balance
        setWallet(res.data.newBalance);

        // ✅ Remove the booked slot from list
        setSlots(prev => prev.filter(s => s.slotid !== slot.slotid));

        alert(`Booked slot ${slot.slotid} via wallet. New balance: ₹${res.data.newBalance}`);
        setSelectedSlot(null);
      } catch (err) {
        console.error("Booking failed:", err?.response?.data || err.message);
        alert("Booking failed.");
      }
    } else {
      alert("Insufficient wallet balance.");
    }
  };

  // ✅ UPI Booking Logic
  const handleUPIBooking = async (slot) => {
    alert(`Slot ${slot.slotid} booked using UPI!`);

    // Simulate booking via UPI (remove from list)
    setSlots(prev => prev.filter(s => s.slotid !== slot.slotid));
    setSelectedSlot(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">Available Parking Slots</h1>

        <div className="mb-6 flex justify-center">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-2 rounded-md text-lg shadow"
          >
            <option value="mumbai">Mumbai</option>
            <option value="delhi">Delhi</option>
            <option value="bangalore">Bangalore</option>
            <option value="pune">Pune</option>
          </select>
        </div>

        <p className="text-center text-gray-700 mb-4">
          Wallet Balance: ₹{wallet}
        </p>

        {loading ? (
          <p className="text-center">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-center text-red-500">No slots found in {location}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <div key={slot._id} className="bg-white p-4 rounded-lg shadow border">
                <h2 className="text-lg font-bold text-blue-700">Slot ID: {slot.slotid}</h2>
                <p>Amount: ₹{slot.amount}</p>
                <p>Created: {new Date(slot.createdat).toLocaleDateString()}</p>
                <p className="mt-2 text-green-600 font-semibold">Available</p>

                {selectedSlot === slot._id ? (
                  <div className="mt-4 space-y-2">
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                      onClick={() => handleWalletBooking(slot)}
                    >
                      Pay with Wallet
                    </button>
                    <button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
                      onClick={() => handleUPIBooking(slot)}
                    >
                      Pay with UPI
                    </button>
                    <button
                      className="w-full bg-gray-300 hover:bg-gray-400 text-black py-2 rounded"
                      onClick={() => setSelectedSlot(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                    onClick={() => setSelectedSlot(slot._id)}
                  >
                    Book Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
