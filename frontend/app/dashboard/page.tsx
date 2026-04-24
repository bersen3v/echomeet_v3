import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth-server"
import { listMeetings, listTasksByUser } from "@/lib/custom-backend"
import { DashboardHeader } from "@/components/dashboard-header"
import { MeetingCard } from "@/components/meeting-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Mic, FileText, CheckSquare } from "lucide-react"
import type { Meeting } from "@/lib/types"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const meetings = (await listMeetings(user.id)).slice(0, 10)
  const taskCounts = await listTasksByUser(user.id)

  const taskCountMap = new Map<string, number>()
  taskCounts?.forEach((task) => {
    const count = taskCountMap.get(task.meeting_id) || 0
    taskCountMap.set(task.meeting_id, count + 1)
  })

  // Calculate stats
  const totalMeetings = meetings?.length || 0
  const completedMeetings = meetings?.filter((m) => m.status === "completed").length || 0
  const totalTasks = taskCounts?.length || 0

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-border/40 bg-card/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMeetings}</p>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedMeetings}</p>
                <p className="text-sm text-muted-foreground">Transcribed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Extracted</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Meetings</h2>
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Link>
          </Button>
        </div>

        {meetings && meetings.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting: Meeting) => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting} 
                taskCount={taskCountMap.get(meeting.id) || 0}
              />
            ))}
          </div>
        ) : (
          <Card className="mt-6 border-border/40 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No meetings yet</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Get started by uploading your first meeting recording. We&apos;ll transcribe it and extract key insights.
              </p>
              <Button asChild className="mt-6">
                <Link href="/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first meeting
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
