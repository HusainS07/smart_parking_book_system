
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Pusher from 'pusher-js';

export default function BookClient({ initialSlots, initialWallet, session, location, currentHour, initialError }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slots, setSlots] = useState(initialSlots);
  const [wallet, setWallet] = useState(initialWallet);
  const [selectedLocation, setSelectedLocation] = useState(location);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [currentHourState, setCurrentHourState] = useState(currentHour);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    initialError && !initialError.includes('wallet') ? initialError : null
  );
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: '', visible: false }), 3000);
  };

  // Initialize Pusher for real-time updates
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe('parking-bookings');

    channel.bind('booking_created', (data) => {
      console.log('Client: Received webhook:', data);
      if (data.location === selectedLocation) {
        setSlots((prev) =>
          prev.map((s) =>
            s.slotid === data.slotid
              ? {
                  ...s,
                  bookedHours: [
                    ...(Array.isArray(s.bookedHours) ? s.bookedHours : []),
                    { hour: data.hour, email: data.email, date: new Date(data.date) },
                  ],
                }
              : s
          )
        );
        showToast(`Slot ${data.slotid} booked at ${data.hour}:00–${data.hour + 1}:00`, 'info');
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [selectedLocation]);

  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true);
        console.log(`Client: Fetching slots for location: ${selectedLocation}`);
        const res = await axios.get(`/api/slots?location=${selectedLocation}`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log('Client: Fetched slots:', JSON.stringify(res.data.slots, null, 2));
        setSlots(res.data.slots);
        setCurrentHourState(res.data.currentHour || parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })));
        setError(null);
      } catch (err) {
        console.error('Client: Error fetching slots:', err);
        const errorMsg = err.response?.data?.error || `Failed to load slots for ${selectedLocation}. Please try another location or contact support.`;
        setError(errorMsg);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }

    if (selectedLocation !== location) {
      fetchSlots();
    }
  }, [selectedLocation, location]);

  useEffect(() => {
    async function fetchWallet() {
      if (session?.user?.email) {
        try {
          console.log(`Client: Fetching wallet for ${session.user.email}`);
          const res = await axios.get(`/api/wallet/amount`, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
          setWallet(res.data.balance);
          console.log(`Client: Fetched wallet balance: ₹${res.data.balance}`);
          setError(null);
        } catch (err) {
          console.error('Client: Wallet fetch error:', err);
        }
      } else {
        console.log('Client: No session or email found, skipping wallet fetch');
      }
    }

    fetchWallet();
  }, [session]);

  const handleWalletBooking = async (slot) => {
    if (selectedHour === null) {
      showToast('Please select an hour');
      return;
    }

    if (!session?.user) {
      showToast('Please log in');
      return;
    }

    if (wallet < slot.amount) {
      showToast('Insufficient wallet balance');
      return;
    }

    try {
      const bookingDate = formatDate(new Date());
      console.log('Client: Wallet Booking Payload:', { slotid: slot.slotid, hour: selectedHour, date: bookingDate, email: session.user.email, location: selectedLocation });

      const res = await axios.post('/api/wallet/deduct', {
        amount: slot.amount,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      await axios.post('/api/slots/book', {
        slotid: slot.slotid,
        hour: selectedHour,
        date: bookingDate,
        email: session.user.email,
        location: selectedLocation,
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
                  { hour: selectedHour, email: session.user.email, date: new Date(bookingDate) },
                ],
              }
            : s
        )
      );

      showToast(`Booked slot ${slot.slotid} at ${selectedHour}:00–${selectedHour + 1}:00. New balance: ₹${res.data.newBalance}`, 'success');
      setSelectedSlot(null);
      setSelectedHour(null);
    } catch (err) {
      console.error('Client: Wallet booking error:', err);
      showToast(`Booking failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleUPIBooking = async (slot) => {
    if (selectedHour === null) {
      showToast('Please select an hour');
      return;
    }

    if (!session?.user) {
      showToast('Please log in');
      return;
    }

    try {
      console.log('Client: Initiating UPI payment for slot:', slot.slotid);
      const orderResponse = await axios.post('/api/payments/create-order', {
        slotid: slot.slotid,
        amount: slot.amount,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      const { orderId, amount, currency } = orderResponse.data;
      console.log('Client: Order created:', { orderId, amount, currency });

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const bookingDate = formatDate(new Date());
        console.log('Client: UPI Booking Payload:', {
          slotid: slot.slotid,
          hour: selectedHour,
          date: bookingDate,
          email: session.user.email,
          location: selectedLocation,
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
              console.log('Client: Razorpay Response:', response);
              await axios.post('/api/slots/book', {
                slotid: slot.slotid,
                hour: selectedHour,
                date: bookingDate,
                payment_id: response.razorpay_payment_id,
                email: session.user.email,
                location: selectedLocation,
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
                            date: new Date(bookingDate),
                            payment_id: response.razorpay_payment_id,
                          },
                        ],
                      }
                    : s
                )
              );

              showToast(`Booked slot ${slot.slotid} at ${selectedHour}:00–${selectedHour + 1}:00 via UPI. Payment ID: ${response.razorpay_payment_id}`, 'success');
              setSelectedSlot(null);
              setSelectedHour(null);
            } catch (err) {
              console.error('Client: Booking error after payment:', err);
              showToast(`Booking failed: ${err.response?.data?.error || 'Unknown error'}`);
            }
          },
          prefill: {
            email: session.user.email,
            contact: session.user.phone || '',
            method: 'upi',
            vpa: 'success@razorpay',
          },
          theme: {
            color: '#4B0082',
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

        console.log('Client: Razorpay Options:', options);
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          console.error('Client: Payment failed:', response.error);
          showToast(`Payment failed: ${response.error.description || 'Invalid UPI ID or payment issue'}`);
        });
        rzp.open();
      };

      script.onerror = () => {
        console.error('Client: Failed to load Razorpay SDK');
        showToast('Failed to load Razorpay SDK');
      };
    } catch (err) {
      console.error('Client: UPI payment error:', err);
      showToast(`UPI payment failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  // Update URL when location changes
  useEffect(() => {
    if (selectedLocation !== location) {
      router.push(`/book?location=${selectedLocation}`, undefined, { shallow: true });
    }
  }, [selectedLocation, location, router]);

  return (
    <>
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in-out ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 0111.314 0z" />
          </svg>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full sm:w-64 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
          >
            <option value="mumbai">Mumbai</option>
            <option value="delhi">Delhi</option>
            <option value="bangalore">Bangalore</option>
            <option value="pune">Pune</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Wallet Balance: <span className="text-green-600 font-semibold">₹{wallet}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg text-center">
          No slots found in {selectedLocation}. Try another location or contact support.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => {
            const today = formatDate(new Date());
            const bookedHoursToday = (Array.isArray(slot.bookedHours) ? slot.bookedHours : []).filter(
              (bh) =>
                bh.date &&
                (bh.date.toISOString ? bh.date.toISOString().split('T')[0] === today : formatDate(new Date(bh.date)) === today)
            ).map((bh) => bh.hour);
            console.log(`Client: Slot ${slot.slotid} bookedHoursToday:`, bookedHoursToday, `currentHour: ${currentHourState}`);
            return (
              <div
                key={slot._id}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
              >
                <h2 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Slot: {slot.slotid}
                </h2>
                <p className="text-gray-600 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Lot: {slot.lotId?.lotName || 'Unknown'}
                </p>
                <p className="text-gray-600 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Address: {slot.lotId?.address || 'Unknown'}
                </p>
                <p className="text-gray-600 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Amount: ₹{slot.amount}
                </p>
                <p className="text-gray-600 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created: {new Date(slot.createdat).toLocaleDateString()}
                </p>

                {selectedSlot === slot._id ? (
                  <div className="mt-6 space-y-4">
                    <select
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                      value={selectedHour ?? ''}
                      onChange={(e) => setSelectedHour(Number(e.target.value))}
                    >
                      <option value="">🕓 Select Hour (0–23)</option>
                      {hourOptions.map((h) => {
                        const isDisabled = bookedHoursToday.includes(h) || h < currentHourState;
                        console.log(`Client: Hour ${h} disabled: ${isDisabled}, booked: ${bookedHoursToday.includes(h)}, past: ${h < currentHourState}`);
                        return (
                          <option
                            key={h}
                            value={h}
                            disabled={isDisabled}
                            className={isDisabled ? 'text-gray-400' : 'text-gray-700'}
                          >
                            {`${h}:00–${h + 1}:00`}
                            {isDisabled ? (bookedHoursToday.includes(h) ? ' (Booked)' : ' (Expired)') : ''}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                      onClick={() => handleWalletBooking(slot)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Pay with Wallet
                    </button>

                    <button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                      onClick={() => handleUPIBooking(slot)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Pay with UPI
                    </button>

                    <button
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                      onClick={() => {
                        setSelectedSlot(null);
                        setSelectedHour(null);
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedSlot(slot._id);
                      setSelectedHour(null);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInOut {
          0% { transform: translateX(100%); opacity: 0; }
          10% { transform: translateX(0); opacity: 1; }
          90% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slide-in-out {
          animation: slideInOut 3s ease-in-out;
        }
      `}</style>
    </>
  );
}
