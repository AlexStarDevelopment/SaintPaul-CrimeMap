import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { MongoClient } from 'mongodb';
import { getUserById, createUser, updateUser } from './users';
import { User, UserSession } from '../app/models/user';

// Create a promise that resolves to the MongoClient
const clientPromise = MongoClient.connect(process.env.MONGODB_URI!, {
  maxPoolSize: 10,
  minPoolSize: 2,
});

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign ins for now
      return true;
    },
    async session({ session, token, user }) {
      if (user) {
        // User is available when using database sessions
        const dbUser = await getUserById(user.id);

        if (dbUser) {
          // Map database user to session
          const userSession: UserSession = {
            id: user.id, // Use the NextAuth user.id
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
            subscriptionTier: dbUser.subscriptionTier || 'free',
            subscriptionStatus: dbUser.subscriptionStatus || 'active',
            subscriptionEndDate: dbUser.subscriptionEndDate,
            trialEndDate: dbUser.trialEndDate,
            theme: dbUser.theme,
          };

          // Extend the session with our custom user data
          return {
            ...session,
            user: {
              ...session.user,
              ...userSession,
            },
          };
        }
      }

      return session;
    },
    async jwt({ token, user, account }) {
      // Persist user ID in token
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // When a new user is created via NextAuth, also create them in our users collection
      if (user.email) {
        await createUser({
          email: user.email,
          name: user.name || undefined,
          image: user.image || undefined,
        });
      }
    },
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === 'development',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      subscriptionTier: 'free' | 'supporter' | 'pro';
      subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
      subscriptionEndDate?: Date;
      trialEndDate?: Date;
      theme?: 'light' | 'dark' | 'sage' | 'slate';
    };
  }

  interface User {
    subscriptionTier: 'free' | 'supporter' | 'pro';
    subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
    theme?: 'light' | 'dark' | 'sage' | 'slate';
  }
}
