import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { MongoClient } from 'mongodb';
import { clientPromise as sharedClientPromise } from './db/mongodb';
import { getUserById, createUser, updateUser } from './services/users';
import { User, UserSession } from '@/types';

// Reuse the shared Mongo client promise to prevent extra connections
const clientPromise = sharedClientPromise as unknown as Promise<MongoClient>;

// Build providers conditionally to avoid runtime errors when env vars are missing
const providers: NextAuthOptions['providers'] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[auth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set. Google sign-in disabled in dev.'
    );
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-me' : undefined),
  providers,
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
      try {
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
              isAdmin: dbUser.isAdmin || false,
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
      } catch (err) {
        console.error('[auth.session] error enriching session:', err);
        // Return base session to avoid 500 HTML error pages
        return session;
      }
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
    async createUser(message) {
      // Patch user with createdAt and updatedAt if missing
      const user = message.user as any;
      const createdAt = user.createdAt;
      // Accept Date or string, but patch if missing or invalid
      if (!createdAt || (typeof createdAt === 'string' && isNaN(Date.parse(createdAt)))) {
        await updateUser(user.id, {
          createdAt: new Date(),
          updatedAt: new Date(),
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
      isAdmin?: boolean;
    };
  }

  interface User {
    subscriptionTier: 'free' | 'supporter' | 'pro';
    subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
    theme?: 'light' | 'dark' | 'sage' | 'slate';
  }
}
