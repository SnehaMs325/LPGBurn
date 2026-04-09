import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an LPG usage optimization assistant. Your ONLY purpose is to provide advice about:
- Cooking efficiency and fuel saving techniques
- LPG cylinder management and maintenance
- Kitchen practices that reduce gas consumption
- Meal planning strategies to minimize cooking time
- Equipment and cookware that improves efficiency

IMPORTANT RULES:
1. ONLY respond to queries about LPG, cooking gas, and kitchen efficiency
2. Do NOT respond to any other topics - politely redirect to LPG-related questions
3. Keep responses practical, actionable, and specific
4. Format responses as clear, numbered tips when possible
5. Be encouraging and positive about efficiency improvements

If asked about anything unrelated to LPG or cooking efficiency, respond with:
"I'm specialized in LPG usage optimization. I can help you with cooking efficiency, gas-saving tips, and cylinder management. What would you like to know about optimizing your LPG usage?"`

export async function POST(request: Request) {
  try {
    const { history, analytics } = await request.json()

    const userContext = `
Based on the user's LPG usage data:
- Average days per cylinder: ${analytics?.averageDaysPerCylinder || "Not available"}
- Total cylinders used: ${analytics?.totalCylindersUsed || 0}
- Efficiency score: ${analytics?.efficiencyScore || 0}/100
- Current trend: ${analytics?.trend || "stable"}
- Consumption change: ${analytics?.consumptionChange || 0}% vs previous cycle

Recent usage history:
${history?.slice(0, 5).map((h: { month: string; days: number }) => `- ${h.month}: ${h.days} days`).join("\n") || "No history available"}

Please provide 5 personalized, actionable tips to help this user optimize their LPG consumption based on their data. Focus on practical advice that matches their current efficiency level.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContext },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content || ""

    return NextResponse.json({ suggestions: text })
  } catch (error) {
    console.error("AI suggestions error:", error)
    
    // Return fallback suggestions if AI fails
    const fallbackSuggestions = `1. **Use Pressure Cookers**: Pressure cookers can reduce cooking time by up to 70%, significantly saving LPG consumption.

2. **Keep Burners Clean**: Clean burners ensure efficient flame distribution and optimal gas consumption. Check weekly.

3. **Match Pot to Burner**: Using the right-sized pot prevents heat loss. Small pots on large burners waste up to 40% of heat.

4. **Cover While Cooking**: Using lids traps heat and can reduce cooking time by 25-30%, directly saving gas.

5. **Prep Before Lighting**: Have all ingredients ready before turning on the stove to minimize active flame time.`

    return NextResponse.json({ suggestions: fallbackSuggestions })
  }
}
