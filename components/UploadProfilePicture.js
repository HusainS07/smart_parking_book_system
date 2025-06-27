'use client';
import { CldUploadButton } from 'next-cloudinary';

export default function UploadProfilePicture({ onUpload }) {
  return (
    <CldUploadButton
      uploadPreset="user_profile_upload"
      cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}  // this is now PUBLIC
      onUpload={(result) => {
        if (result?.info?.secure_url) {
          onUpload(result.info.secure_url);
        }
      }}
    >
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Upload Profile Picture
      </button>
    </CldUploadButton>
  );
}
