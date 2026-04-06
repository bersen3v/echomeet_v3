import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { MeetingDetailClient } from "./meeting-detail-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface MeetingPageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !meeting) {
    notFound()
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("meeting_id", id)
    .order("created_at", { ascending: true })

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
