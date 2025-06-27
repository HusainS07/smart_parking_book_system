'use client';
import { CldUploadButton } from 'next-cloudinary';

export default function UploadProfilePicture({ onUpload, disabled }) {
  return (
    <CldUploadButton
      uploadPreset="user_profile_upload" // Must match Cloudinary unsigned preset
      onUpload={(result) => {
        if (result?.info?.secure_url) {
          onUpload(result.info.secure_url);
        }
      }}
      onError={(error) => {
        console.error('Cloudinary Upload Error:', error);
        onUpload(null, error?.message || 'Failed to upload image');
      }}
    >
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Uploading...' : 'Upload Profile Picture'}
      </button>
    </CldUploadButton>
  );
}