import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth-server"
import { getMeetingById, listTasksForMeeting } from "@/lib/custom-backend"
import { DashboardHeader } from "@/components/dashboard-header"
import { MeetingDetailClient } from "./meeting-detail-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface MeetingPageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const meeting = await getMeetingById(id)
  if (!meeting || meeting.user_id !== user.id) {
    notFound()
  }

  const tasks = await listTasksForMeeting(id)

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <MeetingDetailClient meeting={meeting} initialTasks={tasks || []} />
      </main>
    </div>
  )
}
