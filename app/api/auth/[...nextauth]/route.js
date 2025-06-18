import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import mongoose from "mongoose";
import User from "@/models/user";
import Wallet from "@/models/wallet";

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
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ email: credentials.email });

        if (!user || user.password !== credentials.password) {
          throw new Error("Invalid email or password");
        }

        // ✅ Add role to the returned object
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || "user", // default if not defined
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      await mongoose.connect(process.env.MONGODB_URI);

      const existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        const name = user.name || user.email.split("@")[0];

        // ✅ Set default role = 'user' for OAuth sign-in
        const newUser = await User.create({
          email: user.email,
          name,
          password: null,
          role: "user", // ✅ default role for Google/GitHub
        });

        await Wallet.create({
          username: name,
          balance: 0,
        });
      } else {
        const walletExists = await Wallet.findOne({ username: existingUser.name });

        if (!walletExists) {
          await Wallet.create({
            username: existingUser.name,
            balance: 0,
          });
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user", // ✅ Set role in token
        };
      } else {
        // ✅ If already logged in and token exists, fetch role from DB
        await mongoose.connect(process.env.MONGODB_URI);
        const dbUser = await User.findOne({ email: token.user?.email });
        token.user.role = dbUser?.role || "user";
      }

      return token;
    },

    async session({ session, token }) {
      session.user = token.user; // ✅ Role available in session.user.role
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
