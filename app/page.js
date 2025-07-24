'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-blue-50 min-h-screen py-12 px-4 sm:px-6 md:px-8">
      <div className="bg-white rounded-3xl shadow-lg max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 relative overflow-hidden">

        {/* Decorative Icons */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 opacity-40">
          <Image src="/Images/left-icon.png" alt="left deco" width={40} height={40} />
        </div>
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 opacity-40">
          <Image src="/Images/right-icon.png" alt="right deco" width={40} height={40} />
        </div>

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row justify-between items-center gap-10">
          {/* Left Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-700 leading-tight">
              Explore the World with Us
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-4">
              Your Trusted Guides to Unforgettable Experiences.
            </p>

           <Link href="/book">
              <button className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full text-base sm:text-lg shadow-md hover:scale-105 transition-transform">
                Book Now
              </button>
            </Link>

          </div>

          {/* Right Image Grid */}
          <div className="grid grid-cols-2 grid-rows-3 gap-3 sm:gap-4 flex-1 w-full">
            {[
              'Gemini_Generated_Image_h3uk0sh3uk0sh3uk.jpg',
              '/Images/place2.jpg',
              '/Images/place3.jpg',
              '/Images/place4.jpg',
              '/Images/place5.jpg',
              '/Images/place6.jpg',
            ].map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md h-28 sm:h-36 md:h-40 w-full">
                <Image
                  src={src}
                  alt={`place ${i + 1}`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Why Use Us Section */}
      <section className="mt-16 sm:mt-20 max-w-6xl mx-auto text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-4 sm:mb-6">
          Why Use Us?
        </h2>
        <p className="text-gray-600 mb-8 sm:mb-12 text-base sm:text-lg">
          Your Smart Parking Companion – designed for convenience and trust.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            {
              icon: '/public/payment.png',
              title: 'Seamless Payment',
              desc: 'Pay securely and instantly through our integrated platform.',
            },
            {
              icon: '/public/scan.png',
              title: 'Scan Entry/Exit',
              desc: 'Enter and exit using QR code or license plate scanning.',
            },
            {
              icon: '/public/booking.png',
              title: 'Easy Booking',
              desc: 'Reserve your parking spot from anywhere, anytime.',
            },
            {
              icon: '/public/support.png',
              title: '24/7 Support',
              desc: 'We’ve got your back around the clock.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center"
            >
              <Image
                src={feature.icon}
                alt={feature.title}
                width={50}
                height={50}
                className="mb-4"
              />
              <h3 className="text-lg sm:text-xl font-semibold text-blue-700">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-600 mt-2">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
