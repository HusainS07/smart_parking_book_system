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
  const [imageUrl, setImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
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
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = (message, type = 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: '', visible: false }), 3000);
  };

  const handleError = useCallback((err, context) => {
    console.error(`${context} error:`, err);
    const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
    showToast(`${context}: ${errorMessage}`);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`/api/user/${encodeURIComponent(session.user.email)}`)
      .then((res) => {
        setUser(res.data);
        setFormData(res.data);
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
        } else {
          handleError(err, 'Failed to load profile');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, status, handleError]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && value && !/^\d*$/.test(value)) return;
    if (name === 'age' && value && (isNaN(value) || value < 0 || value > 150)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (base64) => {
    setImageUrl(base64);
    setFormData((prev) => ({ ...prev, image: base64 }));
    setImageUploading(false);
  };

  const handleUpdate = async () => {
    if (!formData.email) return;

    setUpdateLoading(true);
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
          headers: { 'Content-Type': 'application/json' },
        }
      );

      setUser(res.data);
      setFormData(res.data);
      setEditing(false);
      setImageUrl(null);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      handleError(err, 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLotFormChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'totalSpots' || name === 'pricePerHour') && value && isNaN(value)) return;
    setLotForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLotSubmit = async () => {
    setLotSubmitLoading(true);
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
      showToast('Parking lot added successfully', 'success');

      const res = await axios.get(`/api/lots?email=${encodeURIComponent(session.user.email)}`);
      setLots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      handleError(err, 'Failed to add parking lot');
    } finally {
      setLotSubmitLoading(false);
    }
  };

  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(user) || imageUrl;
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    setEditing(false);
    setFormData(user);
    setImageUrl(null);
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in-out ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-indigo-900 tracking-tight">👤 My Profile</h1>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium transition duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h3a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      <div className="flex space-x-6 border-b border-gray-200 mb-8">
        {[
          { key: 'details', label: 'Profile Details' },
          { key: 'bookings', label: 'My Bookings' },
          { key: 'lots', label: 'My Lots' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-2 font-medium text-sm transition duration-200 ${
              activeTab === tab.key
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && user && (
        <div className="bg-white rounded-2xl shadow-md p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="relative">
              <Image
                src={imageUrl || formData.image || user.image || '/default-profile.jpg'}
                alt="Profile"
                width={120}
                height={120}
                className="rounded-full object-cover border-2 border-gray-200 shadow-sm"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-indigo-900">{user.name || 'No Name'}</h2>
              <p className="text-gray-600">{user.email}</p>
              {user.phone && <p className="text-gray-600">{user.phone}</p>}
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
              <div key={field} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                {type === 'select' ? (
                  <select
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                      editing
                        ? 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent'
                        : 'bg-gray-100 border-gray-200 text-gray-600'
                    } transition duration-200`}
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option || `Select ${label}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field}
                    type={type}
                    value={formData[field] || ''}
                    onChange={handleInputChange}
                    readOnly={!editing}
                    placeholder={label}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                      editing
                        ? 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent'
                        : 'bg-gray-100 border-gray-200 text-gray-600'
                    } transition duration-200`}
                    min={type === 'number' ? '0' : undefined}
                    max={type === 'number' ? '150' : undefined}
                  />
                )}
              </div>
            ))}

            <div className="col-span-1 sm:col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                readOnly={!editing}
                placeholder="Address"
                rows="3"
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${
                  editing
                    ? 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent'
                    : 'bg-gray-100 border-gray-200 text-gray-600'
                } transition duration-200`}
              />
            </div>

            {editing && (
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Profile Picture</label>
                <UploadProfilePicture onUpload={handleImageUpload} />
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 5MB. Supported formats: JPEG, PNG, GIF.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={updateLoading || imageUploading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {updateLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updateLoading || imageUploading}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {bookingsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center animate-fade-in">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 font-medium">No bookings yet.</p>
              <p className="text-sm text-gray-500 mt-2">Your future bookings will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((b, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                >
                  <div className="space-y-3">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold text-gray-700">Slot:</span> {b.slotid || 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="font-semibold text-gray-700">Location:</span> {b.location || 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-gray-700">Time:</span> {b.time || 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-gray-700">Amount:</span>{' '}
                      <span className="text-green-600 font-semibold">₹{b.amount || '0'}</span>
                    </p>
                    <button
                      onClick={() => showToast('Booking cancellation not yet implemented', 'error')}
                      className="mt-4 w-full bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Booking
                    </button>
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
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {showLotForm ? 'Cancel' : 'Add New Lot'}
          </button>

          {showLotForm && (
            <div className="bg-white rounded-2xl shadow-md p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">Add New Parking Lot</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Lot Name *</label>
                  <input
                    name="lotName"
                    placeholder="Lot Name"
                    value={lotForm.lotName}
                    onChange={handleLotFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">City *</label>
                  <input
                    name="city"
                    placeholder="City"
                    value={lotForm.city}
                    onChange={handleLotFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                    required
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700">Address *</label>
                  <textarea
                    name="address"
                    placeholder="Address"
                    value={lotForm.address}
                    onChange={handleLotFormChange}
                    rows="3"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200 resize-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Total Spots *</label>
                  <input
                    name="totalSpots"
                    type="number"
                    placeholder="Total Spots"
                    value={lotForm.totalSpots}
                    onChange={handleLotFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Price Per Hour (₹) *</label>
                  <input
                    name="pricePerHour"
                    type="number"
                    step="0.01"
                    placeholder="Price Per Hour"
                    value={lotForm.pricePerHour}
                    onChange={handleLotFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                    min="0"
                    required
                  />
                </div>
              </div>
              <button
                onClick={handleLotSubmit}
                disabled={!isLotFormValid || lotSubmitLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {lotSubmitLoading ? 'Submitting...' : 'Submit Lot'}
              </button>
            </div>
          )}

          {lotsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            </div>
          ) : lots.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center animate-fade-in">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-gray-600 font-medium">No parking lots added yet.</p>
              <p className="text-sm text-gray-500 mt-2">Add your first parking lot to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lots.map((lot, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-indigo-900">{lot.lotName}</h3>
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
                    <p className="text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {lot.address}, {lot.city}
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-sm text-gray-500">Total Spots</span>
                        <p className="font-semibold text-gray-700">{lot.totalSpots}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Price/Hour</span>
                        <p className="font-semibold text-green-600">₹{lot.pricePerHour}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}