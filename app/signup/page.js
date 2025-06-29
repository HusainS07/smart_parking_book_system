'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('/api/register', { email, password });

      if (response.status === 201) {
        router.push('/login');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred during registration.';
      setError(message);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-80 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-[#003049]">Create an Account</h2>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-[#003049]">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring focus:ring-[#2A6F97] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-[#003049]">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring focus:ring-[#2A6F97] focus:outline-none"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-[#003049]">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring focus:ring-[#2A6F97] focus:outline-none"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#003049] to-[#2A6F97] text-white font-semibold py-2 rounded-md hover:opacity-90 transition"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[#003049]">
          Already have an account?{' '}
          <button onClick={handleLoginRedirect} className="blue-600 font-medium underline hover:text-[#2A6F97]">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
