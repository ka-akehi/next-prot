import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

const MAX_2FA_AGE = 1000 * 60 * 60; // 1時間

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // JWTセッション戦略を明示
  },
  pages: {
    signIn: '/login', // ← ここを追加
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });

        token.twoFactorEnabled = dbUser?.twoFactorEnabled ?? false;

        if (dbUser?.twoFactorEnabled) {
          const lastAt = dbUser.lastTwoFactorAt?.getTime() ?? 0;
          const expired = Date.now() - lastAt > MAX_2FA_AGE;

          token.twoFactorVerified = !expired;
        } else {
          token.twoFactorVerified = false;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.twoFactorEnabled = token.twoFactorEnabled;
      session.user.twoFactorVerified = token.twoFactorVerified;
      session.user.twoFactorVerifiedAt = token.twoFactorVerifiedAt;
      return session;
    },
  },
};
