import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

/**
 * Signing secret for admin sessions. Uses JWT_SECRET when set. Otherwise it is
 * derived from a server-only credential so that it is never a value that
 * appears in the repository. With no server secret at all, sign-in is disabled
 * rather than falling back to a guessable key.
 */
function resolveSecret(): string | null {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ANTHROPIC_API_KEY;
  if (!seed) return null;
  return createHmac('sha256', seed).update('pcm-admin-session-v1').digest('hex');
}

const JWT_SECRET = resolveSecret();
export const authConfigured = Boolean(JWT_SECRET);

export type AgentSession = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
};

export function signToken(payload: AgentSession): string {
  if (!JWT_SECRET) throw new Error('Admin sign-in is not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyToken(token: string): AgentSession | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AgentSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AgentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<AgentSession> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function requireAdmin(): Promise<AgentSession> {
  const session = await requireSession();
  if (session.role !== 'admin') throw new Error('Forbidden');
  return session;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
