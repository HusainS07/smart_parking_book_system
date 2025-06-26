"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();

  return (
    <footer className="bg-gradient-to-b from-[#0c4a6e] to-[#01203c] text-white py-10 px-5 mt-16 rounded-t-3xl">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-around gap-8 text-left">

        {/* Contact Section */}
        <div className="flex-1 min-w-[250px] max-w-xs">
          <h4 className="text-lg font-bold mb-3">Contact Us</h4>
          <p>Phone: +91 8779918798</p>
          <p>
            Email:{" "}
            <a
              href="mailto:smartpark@gmail.com"
              className="text-blue-200 hover:underline"
            >
              smartpark@gmail.com
            </a>
          </p>
          <p>Contact No: +91 4321876543</p>
          <ul className="">
            <li>
              <Link href="/about" className="hover:text-blue-300 hover:underline">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* System Links */}
        <div className="flex-1 min-w-[250px] max-w-xs">
          <h4 className="text-lg font-bold mb-3">A Complete System</h4>
          <ul className="space-y-1">
            <li>Availability</li>
            <li>SmartPay</li>
            <li>Parking Controllers</li>
            <li>Users</li>
          </ul>
        </div>

        {/* Make Money Section */}
        <div className="flex-1 min-w-[250px] max-w-xs">
  <h4 className="text-lg font-bold mb-3">Make Money with Us</h4>
  <ul className="list-none space-y-1">
    <li>
      <button
        onClick={() => router.push('/profile')}
        className="text-white hover:underline hover:text-blue-300 transition"
      >
        Make a Parking Slot and Earn
      </button>
    </li>
  </ul>
</div>

      </div>

      <div className="text-center text-sm text-gray-300 mt-10">
        &copy; {new Date().getFullYear()} SmartPark | All rights reserved
      </div>
    </footer>
  );
};

export default Footer;
