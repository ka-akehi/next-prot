import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      twoFactorEnabled?: boolean;
      twoFactorVerified?: boolean;
      twoFactorVerifiedAt?: number; // ← 追加
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
    twoFactorVerifiedAt?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
    twoFactorVerifiedAt?: number; // ← 追加
  }
}
