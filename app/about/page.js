'use client';
import Head from 'next/head';

export default function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us | SmartPark</title>
        <meta name="description" content="Learn about the vision and the founder of SmartPark" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <section className="pt-24 px-6 max-w-5xl mx-auto text-white">
        <div className="bg-gradient-to-b from-[#0c4a6e] to-[#01203c] p-10 rounded-3xl shadow-lg">
          {/* Company Name & Tagline */}
          <h1 className="text-4xl font-bold text-center mb-6 text-blue-200">
            The SmartPark Group
          </h1>
          <p className="text-center text-lg mb-10 text-blue-100">
            Empowering Smart Cities — One Parking Spot at a Time
          </p>

          {/* Founder Section */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src="/founder.jpg"
              alt="Founder"
              className="w-40 h-40 rounded-full object-cover border-4 border-blue-500 shadow-md"
            />
            <div>
              <h2 className="text-2xl font-semibold text-yellow-400">Mohamed Husain Sakarwala</h2>
              <p className="text-md text-blue-100 mb-2">Founder & CEO, SmartPark</p>
              <p className="text-sm text-white leading-relaxed">
                An electronics engineer turned smart-tech innovator, Husain is the visionary behind
                SmartPark. With a passion for integrating IoT, embedded systems, and seamless user
                experience, he strives to solve one of the biggest urban headaches — parking.
              </p>
              <p className="text-sm text-white mt-2">
                Alumni of <span className="font-semibold text-blue-300">Veermata Jijabai Technological Institute</span>, 
                he brings together technical expertise and a strong sense of public good to develop smart infrastructure solutions.
              </p>
            </div>
          </div>

          {/* Vision Section */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-blue-200 mb-2">Our Vision</h3>
            <p className="text-white text-sm leading-relaxed">
              At SmartPark, we aim to revolutionize urban parking through data-driven systems,
              real-time availability, and seamless booking experiences. Our goal is to help build
              smarter, greener, and more efficient cities — starting with parking.
            </p>
          </div>

          {/* Mission Section */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-blue-200 mb-2">Our Mission</h3>
            <ul className="list-disc ml-6 text-white text-sm space-y-1">
              <li>Reduce traffic congestion caused by inefficient parking.</li>
              <li>Empower citizens to earn from unused spaces with zero hassle.</li>
              <li>Partner with municipalities for smart urban planning.</li>
              <li>Make parking smarter, faster, and more sustainable.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
