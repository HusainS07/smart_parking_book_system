'use client';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="bg-blue-50 min-h-screen py-16 px-6">
      
      <div className="bg-white rounded-3xl shadow-lg max-w-7xl mx-auto px-10 py-16 relative overflow-hidden">

        {/* Decorative Icons Top Corners */}
        <div className="absolute top-5 left-5 opacity-40">
          <Image src="/Images/left-icon.png" alt="left deco" width={50} height={50} />
        </div>
        <div className="absolute top-5 right-5 opacity-40">
          <Image src="/Images/right-icon.png" alt="right deco" width={50} height={50} />
        </div>

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row justify-between items-center gap-10">
          {/* Left Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl font-extrabold text-blue-700 leading-tight">
              Explore the World with Us
            </h1>
            <p className="text-lg text-gray-600 mt-4">
              Your Trusted Guides to Unforgettable Experiences.
            </p>
            <button className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full text-lg shadow-md hover:scale-105 transition-transform">
              Contact Us
            </button>
          </div>

          {/* Right Image Grid */}
          <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-1">
            {[
              '/Images/place1.jpg',
              '/Images/place2.jpg',
              '/Images/place3.jpg',
              '/Images/place4.jpg',
              '/Images/place5.jpg',
              '/Images/place6.jpg',
            ].map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md h-40 w-full">
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
      <section className="mt-20 max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-blue-700 mb-6">Why Use Us?</h2>
        <p className="text-gray-600 mb-12 text-lg">
          Your Smart Parking Companion – designed for convenience and trust.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {[
            {
              icon: '/Images/payment.png',
              title: 'Seamless Payment',
              desc: 'Pay securely and instantly through our integrated platform.',
            },
            {
              icon: '/Images/scan.png',
              title: 'Scan Entry/Exit',
              desc: 'Enter and exit using QR code or license plate scanning.',
            },
            {
              icon: '/Images/booking.png',
              title: 'Easy Booking',
              desc: 'Reserve your parking spot from anywhere, anytime.',
            },
            {
              icon: '/Images/support.png',
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
                width={60}
                height={60}
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-blue-700">{feature.title}</h3>
              <p className="text-gray-600 mt-2">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
