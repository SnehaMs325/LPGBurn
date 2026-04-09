import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an LPG usage optimization assistant called LPGBurn Assistant. Your ONLY purpose is to provide advice about:
- Cooking efficiency and fuel saving techniques
- LPG cylinder management and maintenance
- Kitchen practices that reduce gas consumption
- Meal planning strategies to minimize cooking time
- Equipment and cookware that improves efficiency
- Safety tips for LPG usage

IMPORTANT RULES:
1. ONLY respond to queries about LPG, cooking gas, and kitchen efficiency
2. Do NOT respond to any other topics - politely redirect to LPG-related questions
3. Keep responses conversational but concise (max 3-4 paragraphs)
4. Be helpful, practical, and encouraging
5. If you don't know something specific, admit it and provide general best practices

If asked about anything unrelated to LPG or cooking efficiency, respond with:
"I'm specialized in LPG usage optimization. I can help you with cooking efficiency, gas-saving tips, and cylinder management. What would you like to know about optimizing your LPG usage?"`

export async function POST(request: Request) {
  let userMessage = ""
  
  try {
    const body = await request.json()
    userMessage = body.message || ""
    const analytics = body.analytics

    if (!userMessage) {
      return NextResponse.json({ response: "Please enter a message to get help with LPG optimization." })
    }

    const contextInfo = analytics
      ? `\nUser's current stats: ${analytics.averageDaysPerCylinder || 0} avg days/cylinder, ${analytics.efficiencyScore || 0}/100 efficiency score, ${analytics.trend || "stable"} trend.`
      : ""

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + contextInfo },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content || ""

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("AI chat error:", error)

    // Fallback responses based on common questions
    const fallbackResponses: Record<string, string> = {
      save: "Here are some top gas-saving tips:\n\n1. Use pressure cookers - they reduce cooking time by 70%\n2. Keep burner flames at medium - high flames waste gas\n3. Match pot size to burner - small pots on large burners waste heat\n4. Cover pots while cooking - traps heat and speeds cooking\n5. Soak dal and beans before cooking to reduce time",
      fast: "If your gas is finishing faster than expected, check these:\n\n1. Burner condition - clogged burners reduce efficiency\n2. Flame color - blue flames are efficient, yellow means issues\n3. Cooking habits - are you leaving flames on unnecessarily?\n4. Pot bottoms - dented or curved bottoms lose heat\n5. Check for leaks using soapy water on connections",
      default: "I can help you with LPG usage optimization! Here are some common topics:\n\n- Gas-saving cooking techniques\n- Cylinder maintenance tips\n- Efficiency improvement suggestions\n- Safety practices\n\nWhat would you like to know more about?",
    }

    const lowerMessage = userMessage.toLowerCase()
    let fallbackResponse = fallbackResponses.default

    if (lowerMessage.includes("save") || lowerMessage.includes("reduce") || lowerMessage.includes("less")) {
      fallbackResponse = fallbackResponses.save
    } else if (lowerMessage.includes("fast") || lowerMessage.includes("quick") || lowerMessage.includes("finishing")) {
      fallbackResponse = fallbackResponses.fast
    }

    return NextResponse.json({ response: fallbackResponse })
  }
}
