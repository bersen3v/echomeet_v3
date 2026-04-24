import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckSquare } from "lucide-react"
import type { Meeting } from "@/lib/types"

interface MeetingCardProps {
  meeting: Meeting
  taskCount?: number
}

export function MeetingCard({ meeting, taskCount = 0 }: MeetingCardProps) {
  const statusColors = {
    pending: "bg-warning/10 text-warning border-warning/20",
    processing: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-success/10 text-success border-success/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
  }

  const statusLabels = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="h-full border-border/40 bg-card/50 transition-colors hover:border-primary/40 hover:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-lg">{meeting.title}</CardTitle>
            <Badge variant="outline" className={statusColors[meeting.status]}>
              {statusLabels[meeting.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {meeting.description && (
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{meeting.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(meeting.date)}</span>
            </div>
            
            {meeting.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(meeting.duration)}</span>
              </div>
            )}
            
            {taskCount > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4" />
                <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
