import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

/**
 * ユーザーごとに 2FA シークレットを生成し、DB に保存。
 * さらに Google Authenticator で読み取れる QR コード (Data URL) を返す。
 */
export async function generate2FASecret(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  let secret = user?.twoFactorSecret;
  if (!secret) {
    secret = authenticator.generateSecret();
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret) return false;

  const verified = authenticator.verify({
    secret: user.twoFactorSecret,
    token,
  });

  if (verified) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  return verified;
}
