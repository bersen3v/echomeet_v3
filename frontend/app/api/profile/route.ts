import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth-server"
import { getProfile, updateProfile } from "@/lib/custom-backend"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getProfile(user.id)
  return NextResponse.json({ profile })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { fullName?: string }
  const profile = await updateProfile(user.id, body.fullName || "")
  return NextResponse.json({ profile })
}
