import { AUTH_ERROR_CODES, createPasswordRequiredError } from '@/lib/auth.errors';
import { issuePasswordSetupToken } from '@/lib/password-token';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

const MAX_2FA_AGE = 1000 * 60 * 60; // 1時間
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MS = 1000 * 60 * 15; // 15分

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // JWTセッション戦略を明示
  },
  pages: {
    signIn: '/login', // ← ここを追加
  },
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'メールアドレス', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'パスワード', type: 'password' },
        callbackUrl: { label: 'callbackUrl', type: 'text' },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email?.trim() ?? '';
        const password = credentials?.password ?? '';
        const callbackUrl = credentials?.callbackUrl ?? '/bbs';
        if (!rawEmail || !password) {
          throw new Error(AUTH_ERROR_CODES.MissingCredentials);
        }

        const normalizedEmail = rawEmail.toLowerCase();
        const emailCandidates = Array.from(new Set([normalizedEmail, rawEmail].filter(Boolean)));

        let user = await prisma.user.findFirst({
          where: {
            email: {
              in: emailCandidates,
            },
          },
        });

        if (user && user.email && user.email !== normalizedEmail) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { email: normalizedEmail },
          });
        }

        if (!user) {
          throw new Error(AUTH_ERROR_CODES.InvalidCredentials);
        }

        if (user.lockedUntil && user.lockedUntil <= new Date()) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { lockedUntil: null, loginAttempts: 0 },
          });
        }

        if (!user.passwordHash) {
          const { token } = await issuePasswordSetupToken(user.id);
          const setupUrl = `/account/password/new?redirect=${encodeURIComponent(
            callbackUrl
          )}&token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;
          throw new Error(createPasswordRequiredError(setupUrl));
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error(AUTH_ERROR_CODES.AccountTemporarilyLocked);
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          const nextAttempts = user.loginAttempts + 1;

          if (nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            const lockExpiresAt = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS);
            await prisma.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: 0,
                lockedUntil: lockExpiresAt,
              },
            });
            throw new Error(AUTH_ERROR_CODES.AccountTemporarilyLocked);
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: nextAttempts },
          });

          throw new Error(AUTH_ERROR_CODES.InvalidCredentials);
        }

        if (user.loginAttempts !== 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
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
