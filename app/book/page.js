
import { fetchSlots, fetchWallet } from '@/lib/slotfetch';
import BookClient from './BookClient';
import { getServerSession } from 'next-auth';

// Metadata for SEO
export async function generateMetadata({ searchParams }) {
  const location = searchParams.location || 'mumbai';
  const capitalizedLocation = location.charAt(0).toUpperCase() + location.slice(1);

  return {
    title: `Book Parking Slots in ${capitalizedLocation} | Parking App`,
    description: `Find and book parking slots in ${capitalizedLocation} with ease. Choose from available slots, pay via wallet or UPI, and reserve your spot instantly.`,
    keywords: `parking, ${location}, book parking, parking slots, ${capitalizedLocation} parking`,
    viewport: 'width=device-width, initial-scale=1.0',
    openGraph: {
      title: `Book Parking Slots in ${capitalizedLocation}`,
      description: `Reserve parking slots in ${capitalizedLocation} with our easy-to-use app. Pay securely with wallet or UPI.`,
      url: `${process.env.NEXTAUTH_URL}/book?location=${location}`,
      type: 'website',
      images: [
        {
          url: `${process.env.NEXTAUTH_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `Parking slots in ${capitalizedLocation}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Book Parking Slots in ${capitalizedLocation}`,
      description: `Reserve parking slots in ${capitalizedLocation} with our easy-to-use app.`,
      image: `${process.env.NEXTAUTH_URL}/og-image.jpg`,
    },
    alternates: {
      canonical: `${process.env.NEXTAUTH_URL}/book?location=${location}`,
    },
  };
}

// Optional: Pre-render static paths for locations
export async function generateStaticParams() {
  return [
    { location: 'mumbai' },
    { location: 'delhi' },
    { location: 'bangalore' },
    { location: 'pune' },
  ];
}

export const revalidate = 3600; // Revalidate every hour

export default async function BookPage({ searchParams }) {
  const location = searchParams.location || 'mumbai';
  const session = await getServerSession();
  let slots = [];
  let currentHour = parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));
  let wallet = 0;
  let error = null;

  try {
    const slotData = await fetchSlots(location);
    slots = slotData.slots;
    currentHour = slotData.currentHour || currentHour;
    console.log(`Server: Fetched ${slots.length} slots for ${location}, currentHour: ${currentHour}`);
  } catch (err) {
    error = err.message || `Failed to load slots for ${location}. Please try another location or contact support.`;
    console.error('Server: Slot fetch error:', err);
  }

  if (session?.user?.email) {
    try {
      wallet = await fetchWallet(session.user.email);
      console.log(`Server: Fetched wallet balance: ₹${wallet} for ${session.user.email}`);
    } catch (err) {
      // Suppress wallet error to avoid UI clutter, as client-side fetch will retry
      console.error(`Server: Wallet fetch error for ${session.user.email}:`, err);
      // Only set error if slots also failed, to prioritize critical errors
      if (!error) {
        error = 'Wallet balance may not be up-to-date. Please refresh or contact support.';
      }
    }
  } else {
    console.log('Server: No session or email found, skipping wallet fetch');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-10 tracking-tight">🚗 Book Your Parking Slot</h1>
        <BookClient
          initialSlots={slots}
          initialWallet={wallet}
          session={session}
          location={location}
          currentHour={currentHour}
          initialError={error}
        />
      </div>
    </div>
  );
}
