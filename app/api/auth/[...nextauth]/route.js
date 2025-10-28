// app/api/auth/[...nextauth]/route.js

// It connects to MongoDB using mongoose to store and check user info.

// For credentials login, it finds the user by email and checks if the password matches (you should use hashing later).

// For Google/GitHub login, it automatically creates a new user (and a wallet with ₹0 balance) if they don’t exist.

// It uses JWT tokens to store login sessions securely, not a database session.

// The callbacks (jwt, session, signIn) customize what’s saved in the token/session and ensure the user is stored properly.

// Finally, it exports the handler so Next.js can manage routes like /api/auth/signin, /api/auth/session, etc.

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import mongoose from 'mongoose';
import User from '@/models/user';
import Wallet from '@/models/wallet';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔐 Login attempt:', credentials);

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          console.log('❌ User not found');
          throw new Error('Invalid email or password');
        }

        if (user.password !== credentials.password) {
          console.log('❌ Password mismatch');
          throw new Error('Invalid email or password');
        }

        console.log('✅ Authorized');
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        };
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user;
      }
      return session;
    },

    async signIn({ user }) {
      await mongoose.connect(process.env.MONGODB_URI);

      const existing = await User.findOne({ email: user.email });

      if (!existing) {
        const name = user.name || user.email.split('@')[0];
        const newUser = await User.create({
          email: user.email,
          name,
          password: null,
          role: 'user',
        });

        await Wallet.create({
          username: name,
          email: user.email,
          balance: 0,
        });
      }

      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
