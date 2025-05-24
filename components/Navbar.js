"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Extract the user's name from email (before '@')
  const userName = session?.user?.email?.split('@')[0] || '';

  return (
    <nav className="bg-white text-black px-6 py-4 shadow-md">
      <div className="flex items-center justify-between">

        {/* Logo/Title */}
        <div className="text-xl font-bold">
          <Link href="/" className="hover:underline cursor-pointer">
            SmartPark
          </Link>
        </div>

        {/* Navigation Links */}
        <ul className="flex gap-6 text-md font-medium">
          <li>
            <Link href="/" className="hover:text-blue-600">Home</Link>
          </li>
          {/* Show Signup only if not logged in */}
          {!session && (
            <li>
              <Link href="/signup" className="hover:text-blue-600">Signup</Link>
            </li>
          )}
          <li>
            <Link href="/about" className="hover:text-blue-600">About</Link>
          </li>
          <li>
            <Link href="/help" className="hover:text-blue-600">Help</Link>
          </li>
          {session ? (
            <>
              <li>
                <Link href="/book" className="hover:text-blue-600">Book</Link>
              </li>
              {/* Profile Icon + Dropdown */}
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <FaUserCircle className="text-2xl text-gray-700 hover:text-blue-600" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-55 bg-white border rounded shadow-lg z-10 max-w-xs">
                    <div className="px-4 py-2 text-gray-700">
                      Welcome, {userName}!
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/wallet"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Wallet
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <li>
              <Link href="/login" className="hover:text-blue-600">Login</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
