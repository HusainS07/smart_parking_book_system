'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Page = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      if (session.user.role === 'admin') {
        router.push('/admin_page');
      } else {
        router.push('/book');
      }
    }
  }, [status, session, router]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!res || !res.ok) {
        setError('Invalid email or password');
      } else {
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  const buttonBaseClass =
    'py-2 px-4 flex justify-center items-center w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg';
  const googleBtnClass = `${buttonBaseClass} bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-red-200 text-white`;
  const githubBtnClass = `${buttonBaseClass} bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 focus:ring-offset-gray-200 text-white`;

  if (status === 'loading') {
    return <div className="text-center mt-20 text-lg">Loading...</div>;
  }

  if (session) {
    return (
      <div className="text-center mt-20 px-4">
        <p>
          Signed in as <strong>{session.user.email}</strong>
        </p>
        <button
          onClick={() => signOut()}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailPasswordLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className={`${buttonBaseClass} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white`}
          >
            Log in with Email
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center justify-center">
          <div className="border-t border-gray-300 w-full"></div>
          <span className="mx-2 text-sm text-gray-500">or</span>
          <div className="border-t border-gray-300 w-full"></div>
        </div>

        {/* Social Logins */}
        <div className="flex flex-col gap-3">
          <button type="button" className={googleBtnClass} onClick={() => signIn('google')}>
            Sign in with Google
          </button>

          <button type="button" className={githubBtnClass} onClick={() => signIn('github')}>
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
