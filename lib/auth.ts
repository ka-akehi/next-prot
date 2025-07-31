import { getServerSession } from 'next-auth';
import { authConfig } from './auth.config';

export const getAuthSession = () => getServerSession(authConfig);
