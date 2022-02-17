import bcrypt from 'bcryptjs'
import type { Session } from 'remix'
import { createCookieSessionStorage, redirect } from 'remix'

import { db } from './db.server'

type LoginForm = {
  username: string
  password: string
}

export async function login({ username, password }: LoginForm): Promise<null | { id: string; username: string }> {
  const user = await db.user.findUnique({
    where: { username }
  })
  if (!user) {
    return null
  }
  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isCorrectPassword) {
    return null
  }
  return { id: user.id, username }
}

export async function register({ username, password }: LoginForm): Promise<{ id: string; username: string }> {
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: { username, passwordHash }
  })
  return { id: user.id, username }
}

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
})

export function getUserSession(request: Request): Promise<Session> {
  return storage.getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getUserSession(request)
  const userId = session.get('userId')
  if (!userId || typeof userId !== 'string') {
    return null
  }
  return userId
}

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname): Promise<string> {
  const session = await getUserSession(request)
  const userId = session.get('userId')
  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }
  return userId
}

export async function getUser(request: Request): Promise<null | { id: string; username: string }> {
  const userId = await getUserId(request)
  if (typeof userId !== 'string') {
    return null
  }

  try {
    return await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    })
  } catch {
    throw await logout(request)
  }
}

export async function logout(request: Request): Promise<Response> {
  const session = await storage.getSession(request.headers.get('Cookie'))
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session)
    }
  })
}

export async function createUserSession(userId: string, redirectTo: string): Promise<Response> {
  const session = await storage.getSession()
  session.set('userId', userId)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session)
    }
  })
}
