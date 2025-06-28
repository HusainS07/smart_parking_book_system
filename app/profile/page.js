'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';
import UploadProfilePicture from '../../components/UploadProfilePicture'; // Adjust path
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('details');
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageUrl, setImageUrl] = useState(null); // Store uploaded image base64
  const [imageUploading, setImageUploading] = useState(false); // Track upload state
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [lotSubmitLoading, setLotSubmitLoading] = useState(false);

  // Error handler
  const handleError = useCallback((err, context) => {
    console.error(`${context} error:`, err);
    const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
    setError(`${context}: ${errorMessage}`);
  }, []);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch user data
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`/api/user/${encodeURIComponent(session.user.email)}`)
      .then((res) => {
        setUser(res.data);
        setFormData(res.data);
        setError(null);
      })
      .catch((err) => {
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
            address: '',
          };
          setUser(basicUser);
          setFormData(basicUser);
          setError(null);
        } else {
          handleError(err, 'Failed to load profile');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, status, handleError]);

  // Fetch bookings and lots
  useEffect(() => {
    if (!session?.user?.email) return;

    if (activeTab === 'bookings') {
      setBookingsLoading(true);
      axios
        .get(`/api/bookings/${encodeURIComponent(session.user.email)}`)
        .then((res) => {
          setBookings(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => {
          handleError(err, 'Failed to load bookings');
          setBookings([]);
        })
        .finally(() => {
          setBookingsLoading(false);
        });
    }

    if (activeTab === 'lots') {
      setLotsLoading(true);
      axios
        .get(`/api/lots?email=${encodeURIComponent(session.user.email)}`)
        .then((res) => {
          setLots(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => {
          handleError(err, 'Failed to load parking lots');
          setLots([]);
        })
        .finally(() => {
          setLotsLoading(false);
        });
    }
  }, [activeTab, session, handleError]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone' && value && !/^\d+$/.test(value)) {
      return;
    }

    if (name === 'age' && value && (isNaN(value) || value < 0 || value > 150)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = (base64) => {
    setImageUrl(base64);
    setFormData((prev) => ({ ...prev, image: base64 }));
    setImageUploading(false);
  };

  // Handle profile update
  const handleUpdate = async () => {
    if (!formData.email) return;

    setUpdateLoading(true);
    setError(null);

    try {
      const updatePayload = {
        name: formData.name,
        phone: formData.phone,
        image: formData.image,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        fatherName: formData.fatherName,
        age: formData.age,
        address: formData.address,
      };

      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === undefined || updatePayload[key] === '') {
          delete updatePayload[key];
        }
      });

      const res = await axios.put(
        `/api/user/${encodeURIComponent(formData.email)}`,
        updatePayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setUser(res.data);
      setFormData(res.data);
      setEditing(false);
      setImageUrl(null);
      setError(null);
    } catch (err) {
      handleError(err, 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle lot form changes
  const handleLotFormChange = (e) => {
    const { name, value } = e.target;

    if ((name === 'totalSpots' || name === 'pricePerHour') && value && isNaN(value)) {
      return;
    }

    setLotForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle lot submission
  const handleLotSubmit = async () => {
    setLotSubmitLoading(true);
    setError(null);

    try {
      await axios.post('/api/lots', {
        ownerEmail: session.user.email,
        lotName: lotForm.lotName.trim(),
        address: lotForm.address.trim(),
        city: lotForm.city.trim(),
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

      const res = await axios.get(`/api/lots?email=${encodeURIComponent(session.user.email)}`);
      setLots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      handleError(err, 'Failed to add parking lot');
    } finally {
      setLotSubmitLoading(false);
    }
  };

  const handleLogout = () => signOut();

  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(user) || imageUrl;
    if (hasChanges && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }

    setEditing(false);
    setFormData(user);
    setImageUrl(null);
    setError(null);
  };

  const isLotFormValid =
    lotForm.lotName.trim() &&
    lotForm.address.trim() &&
    lotForm.city.trim() &&
    lotForm.totalSpots &&
    parseInt(lotForm.totalSpots) > 0 &&
    lotForm.pricePerHour &&
    parseFloat(lotForm.pricePerHour) > 0;

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👤 Profile</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 transition font-medium"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-yellow-800 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-yellow-600 hover:text-yellow-800 font-bold text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-6 border-b mb-8">
        {[
          { key: 'details', label: 'Details' },
          { key: 'bookings', label: 'My Bookings' },
          { key: 'lots', label: 'My Lots' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 border-b-2 transition font-medium ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && user && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6">
            <div className="relative">
              <Image
                src={imageUrl || formData.image || user.image || '/default-profile.jpg'}
                alt="Profile"
                width={96}
                height={96}
                className="rounded-full object-cover border-2 border-gray-200"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{user.name || 'No Name'}</h2>
              <p className="text-gray-600 text-sm">{user.email}</p>
              {user.phone && <p className="text-gray-600 text-sm">{user.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { field: 'name', label: 'Full Name', type: 'text' },
              { field: 'firstName', label: 'First Name', type: 'text' },
              { field: 'lastName', label: 'Last Name', type: 'text' },
              { field: 'gender', label: 'Gender', type: 'select', options: ['', 'Male', 'Female', 'Other'] },
              { field: 'phone', label: 'Phone Number', type: 'tel' },
              { field: 'dob', label: 'Date of Birth', type: 'date' },
              { field: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
              { field: 'fatherName', label: 'Father Name', type: 'text' },
              { field: 'age', label: 'Age', type: 'number' },
            ].map(({ field, label, type, options }) => (
              type === 'select' ? (
                <select
                  key={field}
                  name={field}
                  value={formData[field] || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={`border rounded px-3 py-2 text-sm ${
                    editing ? 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400' : 'bg-gray-100'
                  }`}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option || `Select ${label}`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  key={field}
                  name={field}
                  type={type}
                  value={formData[field] || ''}
                  onChange={handleInputChange}
                  readOnly={!editing}
                  placeholder={label}
                  className={`border rounded px-3 py-2 text-sm ${
                    editing ? 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400' : 'bg-gray-100'
                  }`}
                  min={type === 'number' ? '0' : undefined}
                  max={type === 'number' ? '150' : undefined}
                />
              )
            ))}

            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              readOnly={!editing}
              placeholder="Address"
              rows="3"
              className={`col-span-2 border rounded px-3 py-2 text-sm resize-none ${
                editing ? 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400' : 'bg-gray-100'
              }`}
            />

            {editing && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <UploadProfilePicture onUpload={handleImageUpload} />
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 5MB. Supported formats: JPEG, PNG, GIF.
                </p>
              </div>
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
                disabled={updateLoading || imageUploading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={updateLoading || imageUploading}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookingsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <p className="text-gray-600">No bookings yet.</p>
              <p className="text-sm text-gray-500 mt-2">Your future bookings will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((b, i) => (
                <div
                  key={i}
                  className="p-4 bg-white rounded-lg shadow border hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold text-gray-700">Slot:</span> {b.slotid || 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Location:</span>{' '}
                      {b.location || 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Time:</span> {b.time || 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Amount:</span>{' '}
                      <span className="text-green-600 font-semibold">₹{b.amount || '0'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lots' && (
        <div className="space-y-6">
          <button
            onClick={() => setShowLotForm(!showLotForm)}
            className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {showLotForm ? 'Cancel' : '+ Add New Lot'}
          </button>

          {showLotForm && (
            <div className="bg-gray-50 rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Parking Lot</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input
                  name="lotName"
                  placeholder="Lot Name *"
                  value={lotForm.lotName}
                  onChange={handleLotFormChange}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  name="city"
                  placeholder="City *"
                  value={lotForm.city}
                  onChange={handleLotFormChange}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <textarea
                  name="address"
                  placeholder="Address *"
                  value={lotForm.address}
                  onChange={handleLotFormChange}
                  rows="3"
                  className="col-span-2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  required
                />
                <input
                  name="totalSpots"
                  type="number"
                  placeholder="Total Spots *"
                  value={lotForm.totalSpots}
                  onChange={handleLotFormChange}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  min="1"
                  required
                />
                <input
                  name="pricePerHour"
                  type="number"
                  step="0.01"
                  placeholder="Price Per Hour (₹) *"
                  value={lotForm.pricePerHour}
                  onChange={handleLotFormChange}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  min="0"
                  required
                />
              </div>
              <button
                onClick={handleLotSubmit}
                disabled={!isLotFormValid || lotSubmitLoading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lotSubmitLoading ? 'Submitting...' : 'Submit Lot'}
              </button>
            </div>
          )}

          {lotsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading lots...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lots.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🅿️</div>
                  <p className="text-gray-600">No parking lots added yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Add your first parking lot to get started.</p>
                </div>
              ) : (
                lots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="p-6 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-800">{lot.lotName}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            lot.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {lot.isApproved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        📍 {lot.address}, {lot.city}
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-sm text-gray-500">Total Spots</span>
                          <p className="font-semibold">{lot.totalSpots}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Price/Hour</span>
                          <p className="font-semibold text-green-600">₹{lot.pricePerHour}</p>
                        </div>
                      </div>
                    </div>
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