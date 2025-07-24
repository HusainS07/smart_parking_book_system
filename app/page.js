'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-blue-50 min-h-screen py-12 px-4 sm:px-6 md:px-8">
      <div className="bg-white rounded-3xl shadow-lg max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 relative overflow-hidden">
        {/* Decorative Icons */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-8 opacity-60">
          <Image
            src="/Images/left-icon.png"
            alt="left deco"
            width={60}
            height={60}
            className="sm:w-16 sm:h-16 md:w-20 md:h-20"
          />
        </div>
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 opacity-60">
          <Image
            src="/Images/right-icon.png"
            alt="right deco"
            width={60}
            height={60}
            className="sm:w-16 sm:h-16 md:w-20 md:h-20"
          />
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
          <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 flex-1 w-full">
            {[
              'Gemini_Generated_Image_h3uk0sh3uk0sh3uk.jpg',
              'parking_front.jpg',
              'parking_alley.jpg',
              'parking_lot.jpg',
              
            ].map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md h-28 sm:h-36 md:h-40 w-full">
                <Image
                  src={src}
                  alt={`place ${i + 1}`}
                  width={350}
                  height={350}
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
              icon: '/payment.png',
              title: 'Seamless Payment',
              desc: 'Pay securely and instantly through our integrated platform.',
            },
            {
              icon: '/scan.jpg',
              title: 'Scan Entry/Exit',
              desc: 'Enter and exit using QR code or license plate scanning. \ Feature coming soon!',
            },
            {
              icon: '/booking.jpg',
              title: 'Easy Booking',
              desc: 'Reserve your parking spot from anywhere, anytime.',
            },
            {
              icon: '/support.jpg',
              title: '24/7 Support',
              desc: "We've got your back around the clock.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-6 sm:p-8 flex flex-col items-center text-center"
            >
              <Image
                src={feature.icon}
                alt={feature.title}
                width={80}
                height={80}
                className="mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
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