
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';

const SignUp = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const onSubmit = async (data) => {
    setError('');

    try {
      const response = await axios.post('/api/register', {
        email: data.email,
        password: data.password,
      });

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

  const password = watch('password'); // Watch password for confirmPassword validation

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-80 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-[#003049]">Create an Account</h2>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-[#003049]">Email</label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Invalid email address',
                },
              })}
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-4 py-2 rounded-md focus:ring focus:ring-[#2A6F97] focus:outline-none`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-[#003049]">Password</label>
            <input
              type="password"
              id="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-4 py-2 rounded-md focus:ring focus:ring-[#2A6F97] focus:outline-none`}
              placeholder="Enter password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-[#003049]">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              className={`w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} px-4 py-2 rounded-md focus:ring focus:ring-[#2A6F97] focus:outline-none`}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
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
