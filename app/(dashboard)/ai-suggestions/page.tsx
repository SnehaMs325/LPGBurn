"use client"

import { useUser } from "@civic/auth/react"
import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, RefreshCw, Sparkles, Send, User, Bot, TrendingDown, AlertTriangle, Flame } from "lucide-react"
import { getUsageHistory, getActiveCylinder } from "@/lib/firestore"
import { calculateAnalytics, type AnalyticsData } from "@/lib/analytics"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface Suggestion {
  id: number
  title: string
  description: string
}

export default function AISuggestionsPage() {
  const { user } = useUser()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [aiInsights, setAiInsights] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return

    try {
      const [history, cylinder] = await Promise.all([
        getUsageHistory(user.id),
        getActiveCylinder(user.id),
      ])

      const analyticsData = calculateAnalytics(history, cylinder)
      setAnalytics(analyticsData)

      // Fetch AI suggestions
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: analyticsData.monthlyData,
          analytics: analyticsData,
        }),
      })

      const data = await response.json()
      const parsedSuggestions = parseSuggestions(data.suggestions)
      setSuggestions(parsedSuggestions)
      
      // Store AI insights for display
      if (data.suggestions) {
        setAiInsights(data.suggestions)
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
      setSuggestions(getDefaultSuggestions())
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [user])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const handleRefresh = () => {
    setIsLoadingSuggestions(true)
    fetchInitialData()
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          analytics,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I could not process your request. Please try again.",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again later.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Generate reduction tips based on peak usage
  const getReductionTips = () => {
    if (!analytics?.peakUsageMonth) return []
    
    const peak = analytics.peakUsageMonth
    const tips = [
      `In ${peak.month}, your cylinder lasted only ${peak.days} days. Consider using pressure cookers more during this period.`,
      "Plan meals ahead to reduce cooking time and gas usage.",
      "Keep pot lids on while cooking to retain heat and cook faster.",
      "Use the right burner size for your pots to prevent heat loss.",
      "Defrost food before cooking to reduce cooking time.",
    ]
    return tips
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight gradient-text">AI Suggestions</h1>
            <div className="live-indicator">
              <span className="live-dot" />
              <span className="text-xs text-muted-foreground">AI Powered</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Get personalized insights and chat with AI about your LPG usage
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoadingSuggestions}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingSuggestions ? "animate-spin" : ""}`} />
          Refresh Tips
        </Button>
      </div>

      {/* AI Insights Section - Text based suggestions before chat */}
      {analytics && analytics.monthlyData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Peak Usage Alert */}
          {analytics.peakUsageMonth && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">Peak Usage Month</AlertTitle>
              <AlertDescription>
                <span className="font-semibold">{analytics.peakUsageMonth.month}</span> had the highest usage with{" "}
                <span className="font-semibold">{analytics.peakUsageMonth.cylinders} cylinder(s)</span> lasting only{" "}
                <span className="font-semibold">{analytics.peakUsageMonth.days} days</span>.
              </AlertDescription>
            </Alert>
          )}

          {/* Efficiency Alert */}
          <Alert className={analytics.efficiencyScore >= 55 ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
            <Flame className={`h-4 w-4 ${analytics.efficiencyScore >= 55 ? "text-green-500" : "text-red-500"}`} />
            <AlertTitle className={analytics.efficiencyScore >= 55 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              Efficiency Score: {analytics.efficiencyScore}/100
            </AlertTitle>
            <AlertDescription>
              {analytics.efficiencyScore >= 55
                ? "Good job! Your gas usage is within normal range."
                : "Your efficiency is below optimal. Follow the tips below to improve."}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Reduction Tips Card */}
      {analytics?.peakUsageMonth && (
        <Card className="card-lift glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              <span className="gradient-text">How to Reduce Usage After Peak Month</span>
            </CardTitle>
            <CardDescription>
              Based on your peak usage in {analytics.peakUsageMonth.month}, here are tips for the following months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getReductionTips().map((tip, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Generated Insights - Text Format */}
        <Card className="card-lift glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="gradient-text">AI Analysis of Your Data</span>
            </CardTitle>
            <CardDescription>
              Personalized insights generated from your usage history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSuggestions ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {suggestion.id}
                    </span>
                    <div>
                      <p className="font-medium">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card className="flex flex-col card-lift glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="gradient-text">Chat with AI Assistant</span>
            </CardTitle>
            <CardDescription>
              Ask questions about LPG usage, cooking tips, or gas-saving techniques
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ScrollArea className="flex-1 pr-4" style={{ height: "300px" }}>
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation! Ask me anything about LPG usage optimization.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {["How to save gas?", "Best cooking practices", "Why is my gas finishing fast?"].map(
                      (prompt) => (
                        <Button
                          key={prompt}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(prompt)}
                        >
                          {prompt}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg bg-muted px-4 py-2">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about LPG usage..."
                disabled={isSending}
              />
              <Button onClick={handleSendMessage} disabled={!input.trim() || isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips Card */}
      <Card className="card-lift glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <span className="gradient-text">Quick Tips</span>
          </CardTitle>
          <CardDescription>Essential gas-saving practices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickTip
              title="Use Pressure Cookers"
              description="Reduces cooking time by up to 70%"
            />
            <QuickTip
              title="Keep Burners Clean"
              description="Ensures efficient flame distribution"
            />
            <QuickTip
              title="Match Pot to Burner"
              description="Prevents up to 40% heat loss"
            />
            <QuickTip
              title="Cover While Cooking"
              description="Reduces cooking time by 25-30%"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickTip({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Lightbulb className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function parseSuggestions(content: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lines = content.split("\n").filter(Boolean)

  let id = 1
  for (const line of lines) {
    const numberedMatch = line.match(/^(\d+)\.\s*\*\*(.+?)\*\*:?\s*(.*)/)
    if (numberedMatch) {
      suggestions.push({
        id: id++,
        title: numberedMatch[2],
        description: numberedMatch[3] || "",
      })
    } else {
      const boldMatch = line.match(/^\*\*(.+?)\*\*:?\s*(.*)/)
      if (boldMatch) {
        suggestions.push({
          id: id++,
          title: boldMatch[1],
          description: boldMatch[2] || "",
        })
      }
    }
  }

  return suggestions.length > 0 ? suggestions : getDefaultSuggestions()
}

function getDefaultSuggestions(): Suggestion[] {
  return [
    {
      id: 1,
      title: "Use Pressure Cookers",
      description: "Pressure cookers can reduce cooking time by up to 70%, significantly saving LPG consumption.",
    },
    {
      id: 2,
      title: "Keep Burners Clean",
      description: "Clean burners ensure efficient flame distribution and optimal gas consumption. Check weekly.",
    },
    {
      id: 3,
      title: "Match Pot to Burner",
      description: "Using the right-sized pot prevents heat loss. Small pots on large burners waste up to 40% of heat.",
    },
    {
      id: 4,
      title: "Cover While Cooking",
      description: "Using lids traps heat and can reduce cooking time by 25-30%, directly saving gas.",
    },
    {
      id: 5,
      title: "Prep Before Lighting",
      description: "Have all ingredients ready before turning on the stove to minimize active flame time.",
    },
  ]
}
