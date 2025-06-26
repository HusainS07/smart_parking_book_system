'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('details');
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [lots, setLots] = useState([]);
  const [showLotForm, setShowLotForm] = useState(false);
  const [lotForm, setLotForm] = useState({
    lotName: '',
    address: '',
    city: '',
    totalSpots: '',
    pricePerHour: '',
  });

  // Add loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [lotsLoading, setLotsLoading] = useState(false);

  // Fetch user data with error handling
  useEffect(() => {
    if (session?.user?.email) {
      setLoading(true);
      setError(null);
      
      axios.get(`/api/user/${encodeURIComponent(session.user.email)}`)
        .then((res) => {
          setUser(res.data);
          setFormData(res.data);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to fetch user:', err);
          setError('Failed to load user profile. Please try refreshing the page.');
          
          // If user doesn't exist (404), create a basic user object
          if (err.response?.status === 404) {
            const basicUser = {
              name: session.user.name || '',
              email: session.user.email,
              image: session.user.image || '',
              firstName: '',
              lastName: '',
              phone: '',
              gender: '',
              dob: '',
              bloodGroup: '',
              fatherName: '',
              age: '',
              address: ''
            };
            setUser(basicUser);
            setFormData(basicUser);
            setError(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [session]);

  // Fetch bookings and lots with error handling
  useEffect(() => {
    if (!session?.user?.email) return;

    if (activeTab === 'bookings') {
      setBookingsLoading(true);
      axios.get(`/api/bookings/${encodeURIComponent(session.user.email)}`)
        .then((res) => {
          setBookings(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to fetch bookings:', err);
          setBookings([]);
        })
        .finally(() => {
          setBookingsLoading(false);
        });
    }

    if (activeTab === 'lots') {
      setLotsLoading(true);
      axios.get(`/api/lots?email=${encodeURIComponent(session.user.email)}`)
        .then((res) => {
          setLots(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to fetch lots:', err);
          setLots([]);
        })
        .finally(() => {
          setLotsLoading(false);
        });
    }
  }, [activeTab, session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleUpdate = async () => {
    const form = new FormData();
    for (const key in formData) {
      if (key !== 'email') form.append(key, formData[key]);
    }
    if (imageFile) form.append('image', imageFile);

    try {
      const res = await axios.put(`/api/profile/${encodeURIComponent(formData.email)}`, form);
      setUser(res.data);
      setEditing(false);
      setError(null);
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleLotFormChange = (e) => {
    const { name, value } = e.target;
    setLotForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLotSubmit = async () => {
    try {
      await axios.post('/api/lots', {
        ownerEmail: session.user.email,
        lotName: lotForm.lotName,
        address: lotForm.address,
        city: lotForm.city,
        totalSpots: parseInt(lotForm.totalSpots),
        pricePerHour: parseFloat(lotForm.pricePerHour),
      });
      
      setShowLotForm(false);
      setLotForm({
        lotName: '',
        address: '',
        city: '',
        totalSpots: '',
        pricePerHour: '',
      });
      
      // Refresh lots list
      const res = await axios.get(`/api/lots?email=${encodeURIComponent(session.user.email)}`);
      setLots(res.data);
    } catch (err) {
      console.error('Failed to add lot:', err);
      setError('Failed to add parking lot. Please try again.');
    }
  };

  const handleLogout = () => signOut();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-lg font-semibold mb-2">⚠️ Error</div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👤 Profile</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 transition"
        >
          Logout
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-yellow-600 text-sm">⚠️ {error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-6 border-b mb-8">
        {['details', 'bookings', 'lots'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-2 border-b-2 transition font-medium ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-600'
            }`}
          >
            {tab === 'details' ? 'Details' : tab === 'bookings' ? 'My Bookings' : 'My Lots'}
          </button>
        ))}
      </div>

      {/* DETAILS TAB */}
      {activeTab === 'details' && user && (
        <div className="space-y-6">
          {/* User summary */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6">
            <img
              src={user.image || '/default-profile.jpg'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border"
              onError={(e) => {
                e.target.src = '/default-profile.jpg';
              }}
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{user.name || 'No Name'}</h2>
              <p className="text-gray-600 text-sm">{user.email} • {user.phone || 'No Phone'}</p>
            </div>
          </div>

          {/* Editable Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'firstName', 'lastName', 'gender', 'phone',
              'dob', 'bloodGroup', 'fatherName', 'age', 'address'
            ].map((field) => (
              <input
                key={field}
                name={field}
                value={formData[field] || ''}
                onChange={handleInputChange}
                readOnly={!editing}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className={`border rounded px-3 py-2 text-sm ${
                  editing ? 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400' : 'bg-gray-100'
                }`}
              />
            ))}
            {editing && (
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="col-span-2 text-sm"
              />
            )}
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setFormData(user); setError(null); }}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookingsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No bookings yet.</p>
            </div>
          ) : (
            bookings.map((b, i) => (
              <div
                key={i}
                className="p-4 bg-white rounded shadow border hover:shadow-md transition"
              >
                <p><span className="font-semibold">Slot:</span> {b.slotid || 'N/A'}</p>
                <p><span className="font-semibold">Location:</span> {b.location || 'N/A'}</p>
                <p><span className="font-semibold">Time:</span> {b.time || 'N/A'}</p>
                <p><span className="font-semibold">Amount:</span> ₹{b.amount || '0'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* LOTS TAB */}
      {activeTab === 'lots' && (
        <div className="space-y-6">
          <button
            onClick={() => setShowLotForm(!showLotForm)}
            className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {showLotForm ? 'Cancel' : 'Add New Lot'}
          </button>

          {showLotForm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded shadow">
              {['lotName', 'address', 'city'].map((field) => (
                <input
                  key={field}
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={lotForm[field]}
                  onChange={handleLotFormChange}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              ))}
              <input
                name="totalSpots"
                type="number"
                placeholder="Total Spots"
                value={lotForm.totalSpots}
                onChange={handleLotFormChange}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="1"
                required
              />
              <input
                name="pricePerHour"
                type="number"
                step="0.01"
                placeholder="Price Per Hour"
                value={lotForm.pricePerHour}
                onChange={handleLotFormChange}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="0"
                required
              />
              <button
                onClick={handleLotSubmit}
                className="col-span-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                disabled={!lotForm.lotName || !lotForm.address || !lotForm.city || !lotForm.totalSpots || !lotForm.pricePerHour}
              >
                Submit Lot
              </button>
            </div>
          )}

          {lotsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading lots...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lots.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-600">No parking lots added yet.</p>
                </div>
              ) : (
                lots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded shadow bg-white hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-bold text-gray-800">{lot.lotName}</h3>
                    <p className="text-sm text-gray-600">{lot.address}, {lot.city}</p>
                    <p className="text-sm">Total Spots: <span className="font-medium">{lot.totalSpots}</span></p>
                    <p className="text-sm">Price/Hour: ₹{lot.pricePerHour}</p>
                    <p className="text-sm">
                      Status: <span className={`font-semibold ${lot.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {lot.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}