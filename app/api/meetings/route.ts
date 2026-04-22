import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth-server"
import { createMeeting } from "@/lib/custom-backend"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    title?: string
    description?: string
    date?: string
    audioFileName?: string | null
  }

  if (!body.title?.trim() || !body.date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 })
  }

  const meeting = await createMeeting({
    userId: user.id,
    title: body.title,
    description: body.description?.trim() || null,
    date: body.date,
    audioFileName: body.audioFileName || null,
  })

  return NextResponse.json({ meeting })
}
