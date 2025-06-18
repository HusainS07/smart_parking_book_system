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
      axios.get(`/api/user/${session.user.email}`).then((res) => {
        setUser(res.data);
        setFormData(res.data);
      });
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email) return;

    if (activeTab === 'bookings') {
      axios.get(`/api/bookings/${session.user.email}`).then((res) => {
        setBookings(res.data || []);
      });
    }

    if (activeTab === 'lots') {
      axios.get(`/api/lots?email=${session.user.email}`).then((res) => {
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
      const res = await axios.put(`/api/profile/${formData.email}`, form);
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
      const res = await axios.get(`/api/lots?email=${session.user.email}`);
      setLots(res.data);
    } catch (err) {
      console.error('Failed to add lot:', err);
    }
  };

  const handleLogout = () => signOut();

  if (!user) return <div className="text-center mt-10">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">👤 Profile</h1>
        <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b pb-3 mb-6">
        {['details', 'bookings', 'lots'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize px-1 pb-1 border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            {tab === 'details' ? 'Details' : tab === 'bookings' ? 'My Bookings' : 'My Lots'}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-6 border-b pb-6">
            <img
              src={user.image || '/default-profile.jpg'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sm text-gray-600">{user.email} • {user.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`border p-2 rounded ${editing ? '' : 'bg-gray-100'}`}
              />
            ))}
            {editing && <input type="file" onChange={handleImageChange} className="col-span-2" />}
          </div>

          {!editing ? (
            <button onClick={() => setEditing(true)} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded">
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-4 mt-4">
              <button onClick={handleUpdate} className="px-5 py-2 bg-green-600 text-white rounded">Save</button>
              <button onClick={() => { setEditing(false); setFormData(user); }} className="px-5 py-2 bg-gray-300 text-gray-800 rounded">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            bookings.map((b, i) => (
              <div key={i} className="p-4 border rounded bg-white shadow">
                <p><strong>Slot:</strong> {b.slotid}</p>
                <p><strong>Location:</strong> {b.location}</p>
                <p><strong>Time:</strong> {b.time}</p>
                <p><strong>Amount:</strong> ₹{b.amount}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lots Tab */}
      {activeTab === 'lots' && (
        <div className="space-y-6">
          <button onClick={() => setShowLotForm(!showLotForm)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
            {showLotForm ? 'Cancel' : 'Add New Lot'}
          </button>

          {showLotForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded bg-gray-50">
              <input name="lotName" placeholder="Lot Name" value={lotForm.lotName} onChange={handleLotFormChange} className="p-2 border rounded" />
              <input name="address" placeholder="Address" value={lotForm.address} onChange={handleLotFormChange} className="p-2 border rounded" />
              <input name="city" placeholder="City" value={lotForm.city} onChange={handleLotFormChange} className="p-2 border rounded" />
              <input name="totalSpots" type="number" placeholder="Total Spots" value={lotForm.totalSpots} onChange={handleLotFormChange} className="p-2 border rounded" />
              <input name="pricePerHour" type="number" placeholder="Price Per Hour" value={lotForm.pricePerHour} onChange={handleLotFormChange} className="p-2 border rounded" />
              <button onClick={handleLotSubmit} className="col-span-2 px-4 py-2 bg-green-600 text-white rounded">
                Submit Lot
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lots.map((lot, idx) => (
              <div key={idx} className="p-4 border rounded bg-white shadow">
                <h3 className="text-lg font-bold">{lot.lotName}</h3>
                <p>{lot.address}, {lot.city}</p>
                <p>Total Spots: {lot.totalSpots}</p>
                <p>Price/Hour: ₹{lot.pricePerHour}</p>
                <p>Status: <span className={`font-semibold ${lot.isApproved ? 'text-green-600' : 'text-orange-500'}`}>{lot.isApproved ? 'Approved' : 'Pending'}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
