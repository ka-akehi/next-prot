import { PASSWORD_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@infrastructure/persistence/prisma';

const PASSWORD_SETUP_TOKEN_TTL_MS = 1000 * 60 * 15; // 15 minutes

export async function issuePasswordSetupToken(userId?: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = await hash(token, 10);
  const expiresAt = new Date(Date.now() + PASSWORD_SETUP_TOKEN_TTL_MS);

  if (!userId) {
    throw new Error(PASSWORD_ERROR_MESSAGES.userIdRequired);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordSetupToken: tokenHash,
      passwordSetupTokenExpires: expiresAt,
    },
  });

  return { token, expiresAt };
}

export { PASSWORD_SETUP_TOKEN_TTL_MS };
