import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

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
        console.log('🔐 Login attempt:', credentials.email);

        const result = await query('SELECT * FROM users WHERE email = $1', [credentials.email]);
        const user = result.rows[0];

        if (!user) {
          console.log('❌ User not found');
          throw new Error('Invalid email or password');
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          console.log('❌ Password mismatch');
          throw new Error('Invalid email or password');
        }

        console.log('✅ Authorized');
        return {
          id: user.id,
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
      const existing = await query('SELECT id FROM users WHERE email = $1', [user.email]);

      if (existing.rowCount === 0) {
        const name = user.name || user.email.split('@')[0];

        // Create user
        await query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
          [name, user.email, null, 'user']
        );

        // Create wallet
        await query(
          'INSERT INTO wallets (email, balance) VALUES ($1, $2)',
          [user.email, 0]
        );
      }

      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
