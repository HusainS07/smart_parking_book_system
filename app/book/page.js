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
        console.log(`Fetching slots for location: ${location}`);
        const res = await axios.get(`/api/slots?location=${location}`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log('Fetched slots:', JSON.stringify(res.data.slots, null, 2));
        console.log('Server currentHour:', res.data.currentHour);
        setSlots(res.data.slots);
        setCurrentHour(res.data.currentHour || parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })));
        setError(null);
      } catch (err) {
        console.error('Error fetching slots:', err);
        const errorMsg = err.response?.data?.error || `Failed to load slots for ${location}. Please try again or contact support.`;
        setError(errorMsg);
        setSlots([]);
        setCurrentHour(parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })));
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

      const bookingDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
      console.log('Wallet Booking Payload:', { slotid: slot.slotid, hour: selectedHour, date: bookingDate });

      await axios.post('/api/slots/book', {
        slotid: slot.slotid,
        hour: selectedHour,
        date: bookingDate,
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
      console.error('Wallet booking error:', err);
      alert(`❌ Booking failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleUPIBooking = async (slot) => {
    if (selectedHour === null) {
      alert('Please select an hour');
      return;
    }

    if (!session?.user) {
      alert('Please log in');
      return;
    }

    try {
      const orderResponse = await axios.post('/api/payments/create-order', {
        slotid: slot.slotid,
        amount: slot.amount,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      const { orderId, amount, currency } = orderResponse.data;

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const bookingDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
        console.log('UPI Booking Payload:', {
          slotid: slot.slotid,
          hour: selectedHour,
          date: bookingDate,
          payment_id: 'pending',
        });

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          order_id: orderId,
          name: 'Parking Slot Booking',
          description: `Booking for slot ${slot.slotid} at ${selectedHour}:00`,
          image: '/logo.png',
          handler: async (response) => {
            try {
              console.log('Razorpay Response:', response);
              await axios.post('/api/slots/book', {
                slotid: slot.slotid,
                hour: selectedHour,
                date: bookingDate,
                payment_id: response.razorpay_payment_id,
              }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
              });

              setSlots((prev) =>
                prev.map((s) =>
                  s.slotid === slot.slotid
                    ? {
                        ...s,
                        bookedHours: [
                          ...(Array.isArray(s.bookedHours) ? s.bookedHours : []),
                          {
                            hour: selectedHour,
                            email: session.user.email,
                            date: new Date(),
                            payment_id: response.razorpay_payment_id,
                          },
                        ],
                      }
                    : s
                )
              );

              alert(`✅ Booked slot ${slot.slotid} at ${selectedHour}:00–${selectedHour + 1}:00 via UPI. Payment ID: ${response.razorpay_payment_id}`);
              setSelectedSlot(null);
              setSelectedHour(null);
            } catch (err) {
              console.error('Booking error after payment:', err);
              alert(`❌ Booking failed: ${err.response?.data?.error || 'Unknown error'}`);
            }
          },
          prefill: {
            email: session.user.email,
            contact: session.user.phone || '',
          },
          theme: {
            color: '#6B46C1',
          },
          method: {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
            emi: false,
            paylater: false,
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        alert('❌ Failed to load Razorpay SDK');
      };
    } catch (err) {
      console.error('UPI payment error:', err);
      alert(`❌ UPI payment failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
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
          <p className="text-center text-red-500 text-lg">No slots found in {location}. Please try another location or contact support.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const today = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
              const bookedHoursToday = (Array.isArray(slot.bookedHours) ? slot.bookedHours : []).filter(
                (bh) =>
                  bh.date &&
                  (bh.date.toISOString ? bh.date.toISOString().split('T')[0] === today : new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0] === today)
              ).map((bh) => bh.hour);
              console.log(`Slot ${slot.slotid} bookedHoursToday:`, bookedHoursToday, `currentHour: ${currentHour}`);
              return (
                <div
                  key={slot._id}
                  className="bg-white p-5 rounded-xl shadow-lg border hover:shadow-2xl transition-all duration-300"
                >
                  <h2 className="text-xl font-bold text-indigo-700 mb-2">🆔 Slot: {slot.slotid}</h2>
                  <p className="mb-1">📍 Lot: {slot.lotId?.lotName || 'Unknown'}</p>
                  <p className="mb-1">🏠 Address: {slot.lotId?.address || 'Unknown'}</p>
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
                        {hourOptions.map((h) => {
                          const isDisabled = bookedHoursToday.includes(h) || h < currentHour;
                          console.log(`Hour ${h} disabled: ${isDisabled}, booked: ${bookedHoursToday.includes(h)}, past: ${h < currentHour}`);
                          return (
                            <option
                              key={h}
                              value={h}
                              disabled={isDisabled}
                            >
                              {`${h}:00–${h + 1}:00`}
                              {isDisabled ? (bookedHoursToday.includes(h) ? ' (Booked)' : ' (Expired)') : ''}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition"
                        onClick={() => handleWalletBooking(slot)}
                      >
                        💼 Pay with Wallet
                      </button>

                      <button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-md transition"
                        onClick={() => handleUPIBooking(slot)}
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