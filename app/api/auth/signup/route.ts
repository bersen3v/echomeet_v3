import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth-constants"
import { createSession, createUser } from "@/lib/custom-backend"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string
    password?: string
    fullName?: string
  }

  const result = await createUser({
    email: body.email || "",
    password: body.password || "",
    fullName: body.fullName || "",
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const sessionId = await createSession(result.user.id)
  const response = NextResponse.json({ user: result.user })
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
