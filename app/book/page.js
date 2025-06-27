'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function BookingPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState([]);
  const [wallet, setWallet] = useState(0);
  const [location, setLocation] = useState('mumbai');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [currentHour, setCurrentHour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/slots?location=${location}`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log('Fetched slots:', res.data.slots); // Debug
        setSlots(res.data.slots);
        setCurrentHour(res.data.currentHour);
        setError(null);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(err.response?.data?.error || 'Failed to load slots');
        setSlots([]);
        setCurrentHour(new Date().getHours());
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [location]);

  useEffect(() => {
    async function fetchWallet() {
      if (session?.user?.email) {
        try {
          const res = await axios.get(`/api/wallet/amount`, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
          setWallet(res.data.balance);
        } catch (err) {
          console.error('Wallet fetch error:', err);
          setError('Failed to load wallet balance');
        }
      }
    }

    fetchWallet();
  }, [session]);

  const handleWalletBooking = async (slot) => {
    if (selectedHour === null) {
      alert('Please select an hour');
      return;
    }

    if (!session?.user) {
      alert('Please log in');
      return;
    }

    if (wallet < slot.amount) {
      alert('Insufficient wallet balance');
      return;
    }

    try {
      const res = await axios.post('/api/wallet/deduct', {
        amount: slot.amount,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      await axios.post('/api/slots/book', {
        slotid: slot.slotid,
        hour: selectedHour,
        date: new Date().toISOString().split('T')[0],
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      setWallet(res.data.newBalance);

      setSlots((prev) =>
        prev.map((s) =>
          s.slotid === slot.slotid
            ? {
                ...s,
                bookedHours: [
                  ...(Array.isArray(s.bookedHours) ? s.bookedHours : []),
                  { hour: selectedHour, email: session.user.email, date: new Date() },
                ],
              }
            : s
        )
      );

      alert(`✅ Booked slot ${slot.slotid} at ${selectedHour}:00–${selectedHour + 1}:00. New balance: ₹${res.data.newBalance}`);
      setSelectedSlot(null);
      setSelectedHour(null);
    } catch (err) {
      console.error('Booking error:', err);
      alert(`❌ Booking failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleUPIBooking = () => {
    alert('UPI payment feature is in progress and will be introduced later.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-blue-800 mb-8">🚗 Book Your Parking Slot</h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="flex flex-col items-center space-y-4 mb-6 sm:flex-row sm:justify-between sm:space-y-0">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-2 border-blue-400 bg-white px-4 py-2 rounded-md text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="mumbai">Mumbai</option>
            <option value="delhi">Delhi</option>
            <option value="bangalore">Bangalore</option>
            <option value="pune">Pune</option>
          </select>

          <p className="text-blue-700 font-semibold">
            💰 Wallet Balance: <span className="text-green-600">₹{wallet}</span>
          </p>
        </div>

        {loading ? (
          <p className="text-center text-lg text-gray-600">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-center text-red-500 text-lg">No slots found in {location}.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const today = new Date().toISOString().split('T')[0];
              const bookedHoursToday = (Array.isArray(slot.bookedHours) ? slot.bookedHours : []).filter(
                (bh) => bh.date && bh.date.toISOString && bh.date.toISOString().split('T')[0] === today
              ).map((bh) => bh.hour);
              return (
                <div
                  key={slot._id}
                  className="bg-white p-5 rounded-xl shadow-lg border hover:shadow-2xl transition-all duration-300"
                >
                  <h2 className="text-xl font-bold text-indigo-700 mb-2">🆔 Slot: {slot.slotid}</h2>
                  <p className="mb-1">💸 Amount: ₹{slot.amount}</p>
                  <p className="mb-1">📅 Created: {new Date(slot.createdat).toLocaleDateString()}</p>
                  <p className="mt-2 text-green-600 font-medium">
                    ✅ Available Hours: {24 - bookedHoursToday.length}
                  </p>

                  {selectedSlot === slot._id ? (
                    <div className="mt-4 space-y-2">
                      <select
                        className="w-full p-2 rounded-md border-2 border-gray-300 focus:border-blue-400 focus:outline-none"
                        value={selectedHour ?? ''}
                        onChange={(e) => setSelectedHour(Number(e.target.value))}
                      >
                        <option value="">🕓 Select Hour (0–23)</option>
                        {hourOptions.map((h) => (
                          <option
                            key={h}
                            value={h}
                            disabled={bookedHoursToday.includes(h) || h < currentHour}
                          >
                            {`${h}:00–${h + 1}:00`}
                            {h < currentHour
                              ? ' (Expired)'
                              : bookedHoursToday.includes(h)
                              ? ' (Booked)'
                              : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition"
                        onClick={() => handleWalletBooking(slot)}
                      >
                        💼 Pay with Wallet
                      </button>

                      <button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-md transition"
                        onClick={handleUPIBooking}
                      >
                        📲 Pay with UPI
                      </button>

                      <button
                        className="w-full bg-gray-300 hover:bg-gray-400 text-black font-medium py-2 rounded-md"
                        onClick={() => {
                          setSelectedSlot(null);
                          setSelectedHour(null);
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
                      onClick={() => {
                        setSelectedSlot(slot._id);
                        setSelectedHour(null);
                      }}
                    >
                      📅 Book Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}