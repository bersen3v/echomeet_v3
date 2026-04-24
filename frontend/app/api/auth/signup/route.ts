import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth-constants"
import { createSession, createUser, deleteUserById } from "@/lib/custom-backend"

const CRM_SYNC_URL = process.env.CRM_SYNC_URL || "http://contact-email-webhook:8080/api/persons"
const CRM_SYNC_SECRET = process.env.CRM_SYNC_SECRET || ""

async function syncPersonToCrm(input: { email: string; fullName: string }): Promise<void> {
  if (!CRM_SYNC_URL) {
    return
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (CRM_SYNC_SECRET) {
    headers["x-webhook-secret"] = CRM_SYNC_SECRET
  }

  const response = await fetch(CRM_SYNC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: input.email,
      fullName: input.fullName,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to sync person to CRM")
  }
}

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

  try {
    await syncPersonToCrm({
      email: result.user.email,
      fullName: result.user.user_metadata.full_name || "",
    })
  } catch {
    await deleteUserById(result.user.id)
    return NextResponse.json(
      { error: "Failed to sync contact to CRM, registration cancelled" },
      { status: 502 },
    )
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
