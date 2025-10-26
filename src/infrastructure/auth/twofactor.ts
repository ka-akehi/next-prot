import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { findUserById, updateUserById } from '@/repositories/users/user.repository';

/**
 * ユーザーごとに 2FA シークレットを生成し、DB に保存。
 * さらに Google Authenticator で読み取れる QR コード (Data URL) を返す。
 */
export async function generate2FASecret(userId: string): Promise<string> {
  const user = await findUserById(userId);

  let secret = user?.twoFactorSecret;
  if (!secret) {
    secret = authenticator.generateSecret();
    await updateUserById(userId, { twoFactorSecret: secret });
  }

  const otpauth = authenticator.keyuri(
    user?.email ?? 'unknown',
    'MyApp', // ← アプリ名
    secret
  );

  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  return qrCodeUrl;
}

/**
 * ユーザーの 2FA コードを検証
 */
export async function verify2FA(userId: string, token: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user?.twoFactorSecret) return false;

  const verified = authenticator.verify({
    secret: user.twoFactorSecret,
    token,
  });

  if (verified) {
    await updateUserById(userId, {
      twoFactorEnabled: true,
      lastTwoFactorAt: new Date(),
    });
  }

  return verified;
}
