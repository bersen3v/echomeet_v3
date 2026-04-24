export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  duration: number | null
  audio_url: string | null
  transcript: string | null
  summary: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  meeting_id: string
  user_id: string
  title: string
  description: string | null
  assignee: string | null
  deadline: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}
