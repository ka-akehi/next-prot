import {
  ensureAccountNotLocked,
  ensurePasswordIsConfigured,
  fetchUserForEmail,
  mapErrorToAttemptResult,
  markTwoFactorPending,
  resetLoginStateIfExpired,
  resolveRateLimitIdentifier,
  verifyPasswordOrThrow,
  type VerifyPasswordResult,
} from '@/helpers/auth.helpers';
import { buildLogContext, createRateLimitPipeline, RateLimitedError } from '@/helpers/auth/rate-limit';
import { enforceRecaptchaRequirement } from '@/helpers/auth/recaptcha';
import { findUserById } from '@/repositories/users/user.repository';
import { AUTH_ERROR_CODES } from '@domain/auth/auth.errors';
import { logAuthAttempt } from '@infrastructure/logging/auth-attempt-logger';
import { prisma } from '@infrastructure/persistence/prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { extractClientIpFromHeaders } from '@shared/network/extract-client-ip';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

const MAX_2FA_AGE = 1000 * 60 * 60; // 1時間
const DEFAULT_CALLBACK_URL = '/bbs';

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
        email: {
          label: 'メールアドレス',
          type: 'email',
          placeholder: 'you@example.com',
        },
        password: { label: 'パスワード', type: 'password' },
        callbackUrl: { label: 'callbackUrl', type: 'text' },
        captchaToken: { label: 'captchaToken', type: 'text' },
      },
      async authorize(credentials, req) {
        const rawEmail = credentials?.email?.trim() ?? '';
        const password = credentials?.password ?? '';
        const callbackUrl = credentials?.callbackUrl ?? DEFAULT_CALLBACK_URL;
        const captchaToken = credentials?.captchaToken ?? null;
        const normalizedEmail = rawEmail.toLowerCase();
        const usernameForLog = normalizedEmail || rawEmail || null;
        const clientIp = extractClientIpFromHeaders(req?.headers);

        try {
          if (!rawEmail || !password) {
            throw new Error(AUTH_ERROR_CODES.MissingCredentials);
          }

          let user = await fetchUserForEmail(normalizedEmail, rawEmail);
          user = await resetLoginStateIfExpired(user);
          await ensurePasswordIsConfigured(user, callbackUrl);
          ensureAccountNotLocked(user);

          const rateLimitIdentifier = resolveRateLimitIdentifier(user);
          const pipeline = await createRateLimitPipeline(rateLimitIdentifier);

          await enforceRecaptchaRequirement(pipeline.enforceContext?.result, {
            captchaToken,
            clientIp,
          });

          const verification: VerifyPasswordResult = await verifyPasswordOrThrow(user, password, { pipeline });
          user = verification.user;
          user = await markTwoFactorPending(user);

          await logAuthAttempt({
            username: usernameForLog,
            result: 'success',
            req,
            context: buildLogContext(verification.accountRateLimit),
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            twoFactorEnabled: user.twoFactorEnabled,
          };
        } catch (error) {
          const rateLimitFromError = (error as RateLimitedError)?.accountRateLimit;

          await logAuthAttempt({
            username: usernameForLog,
            result: mapErrorToAttemptResult(error),
            reason: error instanceof Error ? error.message : 'unknown-error',
            req,
            context: buildLogContext(rateLimitFromError),
          });

          throw error;
        }
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
        const dbUser = await findUserById(token.id);

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
