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
// ========================================
// 1. BOOKING PAGE FIX - handleUPIBooking
// ========================================
// Replace your handleUPIBooking function with this:


// ========================================
// UPDATED BOOKING PAGE - handleUPIBooking
// Replace in your BookClient component
// ========================================
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
    const bookingDate = formatDate(new Date());
    
    console.log('📝 Client: Creating order with minimal data:', {
      slotid: slot.slotid,
      amount: slot.amount,
      date: bookingDate,
      hour: selectedHour
    });

    // Step 1: Create order (queues only slotid + date + hour)
    const orderResponse = await axios.post('/api/payments/create-order', {
      slotid: slot.slotid,
      amount: slot.amount,
      date: bookingDate,      // ✅ Required for queue
      hour: selectedHour,     // ✅ Required for queue
    }, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    const { orderId, amount, currency } = orderResponse.data;
    console.log('✅ Client: Order created:', { orderId, amount, currency });

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'Parking Slot Booking',
        description: `Slot ${slot.slotid} at ${selectedHour}:00 on ${bookingDate}`,
        image: '/logo.png',
        handler: async (response) => {
          try {
            console.log('✅ Client: Payment successful:', response);
            
            // Step 2: Book the slot
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

            // Update UI
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

            showToast(
              `✅ Booked slot ${slot.slotid} at ${selectedHour}:00 on ${bookingDate}`,
              'success'
            );
            setSelectedSlot(null);
            setSelectedHour(null);
          } catch (err) {
            console.error('❌ Client: Booking error after payment:', err);
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

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('❌ Client: Payment failed:', response.error);
        showToast(`Payment failed: ${response.error.description || 'Payment issue'}`);
      });
      rzp.open();
    };

    script.onerror = () => {
      console.error('❌ Client: Failed to load Razorpay SDK');
      showToast('Failed to load Razorpay SDK');
    };
  } catch (err) {
    console.error('❌ Client: UPI payment error:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-blue-50">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-semibold animate-slide-in-out ${
            toast.type === 'success'
              ? 'bg-green-600'
              : toast.type === 'info'
              ? 'bg-blue-600'
              : 'bg-red-600'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 shadow-md" role="alert" aria-live="assertive">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Location Selector */}
            <div className="flex-1">
              <label htmlFor="location-select" className="block text-sm font-semibold text-gray-700 mb-2">
                Select Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <select
                  id="location-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 appearance-none cursor-pointer hover:border-gray-300"
                  aria-label="Select parking location"
                >
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="pune">Pune</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="lg:ml-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Balance</label>
              <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-lg font-semibold text-white">₹{wallet}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading available slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-5 text-center shadow-sm" role="alert">
            <svg className="w-10 h-10 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-800 font-semibold text-lg">No slots available in {selectedLocation}</p>
            <p className="text-yellow-700 mt-1">Try selecting another location or contact support.</p>
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
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden animate-fade-in"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Slot {slot.slotid}</h3>
                      <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        <span className="text-white font-semibold text-base">₹{slot.amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium">Parking Lot</p>
                          <p className="font-medium text-sm">{slot.lotId?.lotName || 'Unknown'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium">Address</p>
                          <p className="font-medium text-sm">{slot.lotId?.address || 'Unknown'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium">Created</p>
                          <p className="font-medium text-sm">{new Date(slot.createdat).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Interface */}
                    {selectedSlot === slot._id ? (
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="relative">
                          <label htmlFor={`time-slot-${slot._id}`} className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Time Slot
                          </label>
                          <select
                            id={`time-slot-${slot._id}`}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 appearance-none cursor-pointer"
                            value={selectedHour ?? ''}
                            onChange={(e) => setSelectedHour(Number(e.target.value))}
                            aria-label="Select booking hour"
                          >
                            <option value="">🕓 Select Time</option>
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
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                          onClick={() => handleWalletBooking(slot)}
                          aria-label={`Book slot ${slot.slotid} with wallet`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Pay with Wallet
                        </button>

                        <button
                          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                          onClick={() => handleUPIBooking(slot)}
                          aria-label={`Book slot ${slot.slotid} with UPI`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Pay with UPI
                        </button>

                        <button
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
                          onClick={() => {
                            setSelectedSlot(null);
                            setSelectedHour(null);
                          }}
                          aria-label="Cancel booking"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        onClick={() => {
                          setSelectedSlot(slot._id);
                          setSelectedHour(null);
                        }}
                        aria-label={`Book slot ${slot.slotid}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Book This Slot
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </div>
  );
}