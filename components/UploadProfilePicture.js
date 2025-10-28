'use client';

import { useState } from 'react';

export default function UploadProfilePicture({ onUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG, or GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5 MB limit
      alert('Image size must be less than 5MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result; // e.g., data:image/jpeg;base64,...
        onUpload(base64String);
        setUploading(false);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Failed to read image.');
        setUploading(false);
      };
      reader.readAsDataURL(file); // Convert to base64
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process image.');
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition file:disabled:opacity-50"
      />
      {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
    </div>
  );
}