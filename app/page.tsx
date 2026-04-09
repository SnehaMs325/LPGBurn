"use client"

import { useUser } from "@civic/auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Flame, BarChart3, Lightbulb, TrendingUp, ArrowRight } from "lucide-react"
import { getUserProfile, getUsageHistory, createUserProfile } from "@/lib/firestore"
import { PreviousDataForm } from "@/components/onboarding/previous-data-form"

export default function LandingPage() {
  const { user, isLoading, signIn } = useUser()
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)

  useEffect(() => {
    async function checkUserStatus() {
      if (user && !isLoading) {
        setCheckingUser(true)
        try {
          // Check if user already has data
          const [profile, history] = await Promise.all([
            getUserProfile(user.id),
            getUsageHistory(user.id),
          ])

          // If user has no profile, create one and show onboarding
          if (!profile) {
            await createUserProfile(user.id, {
              name: user.name || "User",
              email: user.email || "",
            })
            setShowOnboarding(true)
          } else if (history.length === 0) {
            // User has profile but no data - show onboarding
            setShowOnboarding(true)
          } else {
            // User has data - go to dashboard
            router.push("/dashboard")
          }
        } catch (error) {
          console.error("Error checking user status:", error)
          router.push("/dashboard")
        } finally {
          setCheckingUser(false)
        }
      }
    }

    checkUserStatus()
  }, [user, isLoading, router])

  const handleOnboardingComplete = () => {
    router.push("/dashboard")
  }

  const handleOnboardingSkip = () => {
    router.push("/dashboard")
  }

  // Show onboarding form for new users
  if (showOnboarding && user) {
    return (
      <div className="min-h-screen bg-background py-8">
        <PreviousDataForm
          userId={user.id}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </div>
    )
  }

  // Show loading state while checking user
  if (checkingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-button">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight gradient-text">LPGBurn</span>
          </div>
          <Button
            onClick={() => signIn()}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? "Loading..." : "Sign In"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Track your LPG usage.{" "}
              <span className="gradient-text">Save more.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              LPGBurn helps you monitor your cooking gas consumption, visualize
              usage patterns, and get AI-powered tips to reduce waste and extend
              cylinder life.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => signIn()}
                disabled={isLoading}
                className="w-full gap-2 sm:w-auto glow-button"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to optimize
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools designed to help you understand and reduce your LPG
              consumption.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Usage Analytics"
              description="Visualize your monthly consumption with interactive charts. Track trends and identify patterns in your gas usage."
            />
            <FeatureCard
              icon={<Lightbulb className="h-6 w-6" />}
              title="AI Suggestions"
              description="Get personalized recommendations powered by AI to optimize your cooking habits and reduce gas waste."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Efficiency Score"
              description="See your efficiency rating from 0-100 based on consistency, trends, and overall performance."
            />
            <FeatureCard
              icon={<Flame className="h-6 w-6" />}
              title="Cylinder Tracking"
              description="Monitor your active cylinder with estimated remaining days based on your historical usage data."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="What-If Analysis"
              description="Simulate different usage scenarios to see how small changes can lead to big savings over time."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Predictive Insights"
              description="Know when to order your next cylinder with intelligent predictions based on your consumption history."
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-card border border-primary/30 p-8 sm:p-12 glass-card">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Start saving on your cooking gas today
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join thousands of households optimizing their LPG usage with
                smart tracking and AI-powered insights.
              </p>
              <Button
                size="lg"
                onClick={() => signIn()}
                disabled={isLoading}
                className="mt-8 gap-2"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary glow-button">
                  <Flame className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold gradient-text">LPGBurn</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Built with care for efficient households.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-6 card-lift smooth-transition hover:border-primary/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary smooth-transition group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
