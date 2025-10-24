'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Error handler
  const handleError = useCallback((err, context) => {
    console.error(`${context} error:`, err);
    const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
    setError(`${context}: ${errorMessage}`);
  }, []);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // Reduced timeout to 5s for faster dismissal
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch bookings with retry logic
  useEffect(() => {
    if (!session?.user?.email || activeTab !== 'bookings') return;

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        const res = await axios.get(`/api/bookings/${encodeURIComponent(session.user.email)}`);
        setBookings(res.data);
        setError(null);
      } catch (err) {
        if (err.response?.status === 429 && retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return fetchBookings(); // Retry the request
        }
        handleError(err, 'Failed to load bookings');
        setBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [activeTab, session, handleError]);

  const handleLogout = () => signOut();

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-3 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50">
        <div className="text-center bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
          <a
            href="/api/auth/signin"
            className="mt-4 inline-block bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-150"
            aria-label="Sign in to view profile"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Your Bookings</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label="Log out"
        >
          Logout
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-600 rounded-lg p-4 shadow-sm" role="alert" aria-live="assertive">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {bookingsLoading ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm">
            <div className="relative mx-auto h-8 w-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-2 text-gray-600 font-medium text-sm">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 font-medium">No bookings yet.</p>
            <p className="text-sm text-gray-500 mt-1">Your future bookings will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div
                key={`${booking.slotId}-${booking.date}-${booking.hour}`}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg capitalize text-gray-800">{booking.location}</h3>
                    <p className="text-sm text-gray-600">Slot ID: {booking.slotId}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      booking.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.isApproved ? 'Confirmed' : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span>
                      {new Date(booking.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Time:</span>
                    <span>{booking.time || `${booking.hour}:00–${booking.hour + 1}:00`}</span>
                  </p>
                  {booking.amount && (
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span>₹{booking.amount}</span>
                    </p>
                  )}
                  {booking.paymentId && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      Payment ID: {booking.paymentId}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}