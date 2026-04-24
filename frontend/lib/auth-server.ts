import { cookies } from "next/headers"

import { SESSION_COOKIE_NAME } from "@/lib/auth-constants"
import { getUserBySession, type AppUser } from "@/lib/custom-backend"

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionId) {
    return null
  }

  return getUserBySession(sessionId)
}
