import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth-server"
import { listTasksByUser, updateTaskStatus } from "@/lib/custom-backend"
import type { Task } from "@/lib/types"

interface TaskRouteProps {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: TaskRouteProps) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as { status?: Task["status"] }
  if (!body.status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 })
  }

  const userTasks = await listTasksByUser(user.id)
  const hasAccess = userTasks.some((task) => task.id === id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  const task = await updateTaskStatus(id, body.status)
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  return NextResponse.json({ task })
}
