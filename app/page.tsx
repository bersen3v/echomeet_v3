import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Mic, FileText, CheckSquare, Sparkles, ArrowRight, Zap, Clock, Shield } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4">
              <div className="h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
            </div>
          </div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Transform your meetings into
                <span className="text-primary"> actionable insights</span>
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                EchoMeet uses AI to transcribe your meetings, generate summaries, and extract tasks automatically. 
                Never miss an important detail again.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="#how-it-works">See how it works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-border/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to manage meetings
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful AI features that save you hours every week
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Audio Transcription</h3>
                  <p className="mt-2 text-muted-foreground">
                    Upload your meeting recordings and get accurate transcripts in minutes with speaker identification.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">AI Summaries</h3>
                  <p className="mt-2 text-muted-foreground">
                    Get concise summaries highlighting key decisions, topics discussed, and important points.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Task Extraction</h3>
                  <p className="mt-2 text-muted-foreground">
                    Automatically identify action items with assignees and deadlines from your conversations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Smart Search</h3>
                  <p className="mt-2 text-muted-foreground">
                    Search across all your meetings by keywords, topics, or speakers to find exactly what you need.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Fast Processing</h3>
                  <p className="mt-2 text-muted-foreground">
                    Process hour-long meetings in minutes with our optimized AI pipeline.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Secure & Private</h3>
                  <p className="mt-2 text-muted-foreground">
                    Your data is encrypted and never used for training. We take privacy seriously.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="border-t border-border/40 bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three simple steps to transform your meetings
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mt-6 text-xl font-semibold">Upload Recording</h3>
                <p className="mt-2 text-muted-foreground">
                  Upload your meeting audio file or record directly in the app. We support all major formats.
                </p>
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mt-6 text-xl font-semibold">AI Processing</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI transcribes the audio, identifies speakers, and extracts key information.
                </p>
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mt-6 text-xl font-semibold">Get Insights</h3>
                <p className="mt-2 text-muted-foreground">
                  Review your transcript, summary, and extracted tasks. Export or share with your team.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-t border-border/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-4xl font-bold">5hrs</span>
                </div>
                <p className="mt-2 text-muted-foreground">Saved per week</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl font-bold">98%</span>
                <p className="mt-2 text-muted-foreground">Transcription accuracy</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl font-bold">10k+</span>
                <p className="mt-2 text-muted-foreground">Meetings processed</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl font-bold">500+</span>
                <p className="mt-2 text-muted-foreground">Happy teams</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 sm:px-12 sm:py-20">
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                  Ready to transform your meetings?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/80">
                  Start for free and see the difference AI can make in your workflow.
                </p>
                <div className="mt-8">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/auth/sign-up">
                      Get started for free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Mic className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">EchoMeet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 EchoMeet. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
