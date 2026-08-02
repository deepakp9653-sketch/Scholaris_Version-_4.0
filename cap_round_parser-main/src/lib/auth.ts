import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from './db';

const SESSION_COOKIE_NAME = 'scholaris_session';

export interface SessionUser {
  id: string;
  email: string;
}

export async function loginAdmin(email: string, password: string): Promise<SessionUser | null> {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!admin) return null;

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return null;

  // Set session cookie
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ id: admin.id, email: admin.email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return { id: admin.id, email: admin.email };
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;

    const data = JSON.parse(sessionCookie.value);
    if (data && data.id && data.email) {
      return data as SessionUser;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function logoutAdmin() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
