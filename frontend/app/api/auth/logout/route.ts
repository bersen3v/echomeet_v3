import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth-constants"
import { deleteSession } from "@/lib/custom-backend"

export async function POST(request: Request) {
  const sessionId = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1]

  if (sessionId) {
    await deleteSession(sessionId)
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return response
}
