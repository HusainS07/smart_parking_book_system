'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (session) {
      const fetchUserData = async () => {
        try {
          // Fetch user info
          const userResponse = await axios.get(`/api/user/${session.user.email}`);
          setUser(userResponse.data);

          // Fetch user's past and upcoming bookings
          const bookingsResponse = await axios.get(`/api/bookings/${session.user.email}`);
          setBookings(bookingsResponse.data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchUserData();
    }
  }, [session]);

  const handleLogout = () => {
    // Handle logout functionality (using NextAuth.js)
    signOut();
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-md shadow-lg">
        {/* Profile Header */}
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 bg-gray-300 rounded-full">
            {/* Profile Image */}
            <img src={user.profilePicture || '/default-profile.jpg'} alt="Profile" className="w-full h-full rounded-full" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="mt-6 flex justify-end">
          <button onClick={() => alert('Edit Profile clicked')} className="text-blue-500 hover:underline">
            Edit Profile
          </button>
        </div>

        {/* Booking History */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold">Booking History</h3>
          <div className="mt-4">
            {bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              <ul>
                {bookings.map((booking) => (
                  <li key={booking.slotid} className="border-b py-3">
                    <p className="font-semibold">Slot: {booking.slotid}</p>
                    <p>Location: {booking.location}</p>
                    <p>Status: {booking.alloted ? 'Booked' : 'Available'}</p>
                    <p className="text-sm text-gray-500">Created At: {new Date(booking.createdat).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6 flex justify-end">
          <button onClick={handleLogout} className="text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
