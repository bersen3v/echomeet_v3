"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TaskItem } from "@/components/task-item"
import { Calendar, Clock, FileText, CheckSquare, Plus, Loader2 } from "lucide-react"
import type { Meeting, Task } from "@/lib/types"

interface MeetingDetailClientProps {
  meeting: Meeting
  initialTasks: Task[]
}

export function MeetingDetailClient({ meeting, initialTasks }: MeetingDetailClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee: "",
    deadline: "",
    priority: "medium" as "low" | "medium" | "high",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs} hour${hrs !== 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`
    }
    return `${mins} minute${mins !== 1 ? "s" : ""}`
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return
    
    setIsAddingTask(true)

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingId: meeting.id,
        title: newTask.title,
        description: newTask.description || null,
        assignee: newTask.assignee || null,
        deadline: newTask.deadline || null,
        priority: newTask.priority,
      }),
    })

    if (response.ok) {
      const payload = (await response.json()) as { task: Task }
      const data = payload.task
      setTasks([...tasks, data])
      setNewTask({
        title: "",
        description: "",
        assignee: "",
        deadline: "",
        priority: "medium",
      })
      setIsDialogOpen(false)
    }
    
    setIsAddingTask(false)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }

  const completedTasks = tasks.filter((t) => t.status === "done").length
  const totalTasks = tasks.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          <Badge variant="outline" className={statusColors[meeting.status]}>
            {statusLabels[meeting.status]}
          </Badge>
        </div>
        
        {meeting.description && (
          <p className="mt-2 text-muted-foreground">{meeting.description}</p>
        )}
        
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="summary" className="gap-2">
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="transcript" className="gap-2">
            <FileText className="h-4 w-4" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks ({totalTasks})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <CardTitle>Meeting Summary</CardTitle>
              <CardDescription>AI-generated summary of key points and decisions</CardDescription>
            </CardHeader>
            <CardContent>
              {meeting.summary ? (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{meeting.summary}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-medium">No summary available</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {meeting.status === "pending"
                      ? "Summary will be generated after audio processing"
                      : meeting.status === "processing"
                      ? "Summary is being generated..."
                      : "Upload an audio file to generate a summary"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="mt-6">
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <CardTitle>Full Transcript</CardTitle>
              <CardDescription>Complete transcription of the meeting recording</CardDescription>
            </CardHeader>
            <CardContent>
              {meeting.transcript ? (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {meeting.transcript}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-medium">No transcript available</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {meeting.status === "pending"
                      ? "Transcript will be generated after audio processing"
                      : meeting.status === "processing"
                      ? "Transcript is being generated..."
                      : "Upload an audio file to generate a transcript"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Action Items</CardTitle>
                  <CardDescription>
                    {totalTasks > 0
                      ? `${completedTasks} of ${totalTasks} tasks completed`
                      : "Tasks extracted from the meeting"}
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new action item for this meeting.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-title">Title *</Label>
                        <Input
                          id="task-title"
                          placeholder="Task title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          placeholder="Task description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="task-assignee">Assignee</Label>
                          <Input
                            id="task-assignee"
                            placeholder="Who is responsible?"
                            value={newTask.assignee}
                            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="task-priority">Priority</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setNewTask({ ...newTask, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="task-deadline">Deadline</Label>
                        <Input
                          id="task-deadline"
                          type="date"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddTask} disabled={isAddingTask || !newTask.title.trim()}>
                          {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add Task
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <CheckSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-medium">No tasks yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add tasks manually or they will be extracted from the transcript.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
