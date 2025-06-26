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

  useEffect(() => {
    if (session?.user?.email) {
      axios.get(`/api/user/${encodeURIComponent(session.user.email)}`).then((res) => {
        setUser(res.data);
        setFormData(res.data);
      });
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email) return;

    if (activeTab === 'bookings') {
      axios.get(`/api/bookings/${encodeURIComponent(session.user.email)}`).then((res) => {
        setBookings(res.data || []);
      });
    }

    if (activeTab === 'lots') {
      axios.get(`/api/lots?email=${encodeURIComponent(session.user.email)}`).then((res) => {
        setLots(res.data || []);
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
    } catch (err) {
      console.error('Update failed:', err);
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
      const res = await axios.get(`/api/lots?email=${encodeURIComponent(session.user.email)}`);
      setLots(res.data);
    } catch (err) {
      console.error('Failed to add lot:', err);
    }
  };

  const handleLogout = () => signOut();

  if (!user) return <div className="text-center mt-10">Loading profile...</div>;

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
    {activeTab === 'details' && (
      <div className="space-y-6">
        {/* User summary */}
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6">
          <img
            src={user.image || '/default-profile.jpg'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-gray-600 text-sm">{user.email} • {user.phone}</p>
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
              placeholder={field}
              className={`border rounded px-3 py-2 text-sm ${
                editing ? 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400' : 'bg-gray-100'
              }`}
            />
          ))}
          {editing && (
            <input
              type="file"
              onChange={handleImageChange}
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
              onClick={() => { setEditing(false); setFormData(user); }}
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
        {bookings.length === 0 ? (
          <p className="text-gray-600">No bookings yet.</p>
        ) : (
          bookings.map((b, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded shadow border hover:shadow-md transition"
            >
              <p><span className="font-semibold">Slot:</span> {b.slotid}</p>
              <p><span className="font-semibold">Location:</span> {b.location}</p>
              <p><span className="font-semibold">Time:</span> {b.time}</p>
              <p><span className="font-semibold">Amount:</span> ₹{b.amount}</p>
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
                placeholder={field}
                value={lotForm[field]}
                onChange={handleLotFormChange}
                className="p-2 border rounded"
              />
            ))}
            <input
              name="totalSpots"
              type="number"
              placeholder="Total Spots"
              value={lotForm.totalSpots}
              onChange={handleLotFormChange}
              className="p-2 border rounded"
            />
            <input
              name="pricePerHour"
              type="number"
              placeholder="Price Per Hour"
              value={lotForm.pricePerHour}
              onChange={handleLotFormChange}
              className="p-2 border rounded"
            />
            <button
              onClick={handleLotSubmit}
              className="col-span-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Submit Lot
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lots.map((lot, idx) => (
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
          ))}
        </div>
      </div>
    )}
  </div>
);

}
