"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"
import type { Task } from "@/lib/types"

interface TaskItemProps {
  task: Task
  onUpdate?: (task: Task) => void
}

export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/10 text-warning border-warning/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
  }

  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const handleToggle = async () => {
    setIsUpdating(true)
    const newStatus = task.status === "done" ? "todo" : "done"
    
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok && onUpdate) {
      onUpdate({ ...task, status: newStatus })
    }
    setIsUpdating(false)
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/30 p-4 transition-colors hover:bg-card/50">
      <Checkbox
        checked={task.status === "done"}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>
          {task.title}
        </p>
        
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
          
          {task.assignee && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}
          
          {task.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDeadline(task.deadline)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
