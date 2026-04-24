import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth-server"
import { createTask, getMeetingById } from "@/lib/custom-backend"
import type { Task } from "@/lib/types"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    meetingId?: string
    title?: string
    description?: string
    assignee?: string
    deadline?: string
    priority?: Task["priority"]
  }

  if (!body.meetingId || !body.title?.trim()) {
    return NextResponse.json({ error: "Meeting and title are required" }, { status: 400 })
  }

  const meeting = await getMeetingById(body.meetingId)
  if (!meeting || meeting.user_id !== user.id) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  const task = await createTask({
    meetingId: body.meetingId,
    userId: user.id,
    title: body.title,
    description: body.description?.trim() || null,
    assignee: body.assignee?.trim() || null,
    deadline: body.deadline || null,
    priority: body.priority || "medium",
  })

  return NextResponse.json({ task })
}
