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

  // Error handler
  const handleError = useCallback((err, context) => {
    console.error(`${context} error:`, err);
    const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
    setError(`${context}: ${errorMessage}`);
  }, []);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // Reduced to 5s for faster dismissal
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-3 text-gray-600 font-medium">Loading profile...</p>
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
          <button
            onClick={() => signIn()}
            className="mt-4 inline-block bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-150"
            aria-label="Sign in to view profile"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50">
        <div className="text-center bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Your Profile</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label="Log out"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-white rounded-lg shadow-sm border border-gray-100 p-1">
          {[
            { key: 'details', label: 'Profile Details' },
            { key: 'bookings', label: 'My Bookings' },
            { key: 'lots', label: 'My Lots' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
              aria-label={`View ${tab.label.toLowerCase()}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
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

      {/* Profile Details Tab */}
      {activeTab === 'details' && user && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="relative">
              <Image
                src={imageUrl || formData.image || user.image || '/default-profile.jpg'}
                alt="Profile picture"
                width={80}
                height={80}
                className="rounded-full object-cover border-2 border-gray-200"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-800">{user.name || 'No Name'}</h2>
              <p className="text-gray-600 text-sm">{user.email}</p>
              {user.phone && <p className="text-gray-600 text-sm">{user.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
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
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                {type === 'select' ? (
                  <select
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ${
                      editing ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'
                    }`}
                    aria-label={label}
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option || `Select ${label}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field}
                    name={field}
                    type={type}
                    value={formData[field] || ''}
                    onChange={handleInputChange}
                    readOnly={!editing}
                    placeholder={label}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ${
                      editing ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'
                    }`}
                    min={type === 'number' ? '0' : undefined}
                    max={type === 'number' ? '150' : undefined}
                    aria-label={label}
                  />
                )}
              </div>
            ))}

            <div className="col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                readOnly={!editing}
                placeholder="Address"
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ${
                  editing ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'
                }`}
                aria-label="Address"
              />
            </div>

            {editing && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <UploadProfilePicture onUpload={handleImageUpload} disabled={imageUploading} />
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 5MB. Supported formats: JPEG, PNG, GIF.
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Edit profile"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={updateLoading || imageUploading}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save profile changes"
                >
                  {updateLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updateLoading || imageUploading}
                  className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-fade-in">
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
              {bookings.map((b, i) => (
                <div
                  key={i}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100"
                >
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-700">Slot:</span>
                      <span>{b.slotid || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="capitalize">{b.location || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-700">Time:</span>
                      <span>{b.time || `${b.hour}:00–${b.hour + 1}:00`}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span className="text-green-600 font-semibold">₹{b.amount || '0'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lots Tab */}
      {activeTab === 'lots' && (
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => setShowLotForm(!showLotForm)}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={showLotForm ? 'Cancel adding new lot' : 'Add new parking lot'}
          >
            {showLotForm ? 'Cancel' : '+ Add New Lot'}
          </button>

          {showLotForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Parking Lot</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  { name: 'lotName', label: 'Lot Name', type: 'text', required: true },
                  { name: 'city', label: 'City', type: 'text', required: true },
                  { name: 'address', label: 'Address', type: 'textarea', required: true },
                  { name: 'totalSpots', label: 'Total Spots', type: 'number', min: 1, required: true },
                  { name: 'pricePerHour', label: 'Price Per Hour (₹)', type: 'number', step: '0.01', min: 0, required: true },
                ].map(({ name, label, type, min, step, required }) => (
                  <div key={name} className={name === 'address' ? 'col-span-2' : ''}>
                    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                      {label} {required && <span className="text-red-600">*</span>}
                    </label>
                    {type === 'textarea' ? (
                      <textarea
                        id={name}
                        name={name}
                        placeholder={label}
                        value={lotForm[name]}
                        onChange={handleLotFormChange}
                        rows="3"
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 transition duration-150"
                        required={required}
                        aria-label={label}
                      />
                    ) : (
                      <input
                        id={name}
                        name={name}
                        type={type}
                        placeholder={label}
                        value={lotForm[name]}
                        onChange={handleLotFormChange}
                        min={min}
                        step={step}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 transition duration-150"
                        required={required}
                        aria-label={label}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleLotSubmit}
                disabled={!isLotFormValid || lotSubmitLoading}
                className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Submit new parking lot"
              >
                {lotSubmitLoading ? 'Submitting...' : 'Submit Lot'}
              </button>
            </div>
          )}

          {lotsLoading ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm">
              <div className="relative mx-auto h-8 w-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-2 text-gray-600 font-medium text-sm">Loading lots...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lots.length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-white rounded-lg shadow-sm">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-600 font-medium">No parking lots added yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first parking lot to get started.</p>
                </div>
              ) : (
                lots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800">{lot.lotName}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lot.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {lot.isApproved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        <svg className="w-4 h-4 inline-block mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {lot.address}, {lot.city}
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-sm text-gray-500">Total Spots</span>
                          <p className="font-medium">{lot.totalSpots}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Price/Hour</span>
                          <p className="font-medium text-green-600">₹{lot.pricePerHour}</p>
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