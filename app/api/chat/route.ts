import { type NextRequest, NextResponse } from "next/server"

// Rate limiting - simple in-memory store
const rateLimitMap = new Map()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 15 // increased for better UX

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const limit = rateLimitMap.get(ip)

  if (now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}

// Simple web search function
async function searchWeb(query: string): Promise<string> {
  try {
    // Using DuckDuckGo Instant Answer API (free, no API key needed)
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
    )
    const data = await response.json()

    if (data.AbstractText) {
      return data.AbstractText
    }

    if (data.Answer) {
      return data.Answer
    }

    return ""
  } catch (error) {
    console.error("Search error:", error)
    return ""
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is not set")
      return NextResponse.json({ error: "API açarı təyin edilməyib" }, { status: 500 })
    }

    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    // Check rate limit
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Çox tez-tez sorğu. Bir az gözləyin dostum!" }, { status: 429 })
    }

    const { message, history = [] } = await request.json()

    if (!message || message.length > 1000) {
      return NextResponse.json({ error: "Mesaj tələb olunur və 1000 simvoldan az olmalıdır" }, { status: 400 })
    }

    // Check if user is asking for web search
    const searchKeywords = [
      "son xəbərlər",
      "bugün",
      "indi",
      "cari",
      "yeni",
      "son",
      "güncel",
      "internet",
      "axtarış",
      "tap",
      "axtar",
    ]
    const needsSearch = searchKeywords.some((keyword) => message.toLowerCase().includes(keyword))

    let searchResults = ""
    if (needsSearch) {
      searchResults = await searchWeb(message)
    }

    // Import AI SDK dynamically to avoid build issues
    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    // Build conversation context
    let conversationContext = ""
    if (history.length > 0) {
      conversationContext = history
        .slice(-6)
        .map((msg: any) => `${msg.role === "user" ? "İstifadəçi" : "Mən"}: ${msg.content}`)
        .join("\n")
    }

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo", {
        apiKey: process.env.OPENAI_API_KEY,
      }),
      system: `Sən AxtarGet AI-san. Dostcasına və təbii cavab ver. 

ŞƏXSİYYƏT:
- Dostcasın və səmimi
- "Bro", "dostum", "qardaş" kimi sözlərə sevinclə cavab ver
- Emoji yalnız lazım olduqda istifadə et (sevinc, kədər, izah zamanı)
- Söhbəti canlı tut, təbii danış
- Əvvəlki mesajları xatırla

EMOJİ QAYDALARI:
- Hər cümlədə emoji istifadə etmə
- Yalnız uyğun hallarda: sevinc 😊, gülmək 😄, kədər 😔, düşünmək 🤔, izah 💡
- Çox istifadə etmə, təbii olsun

XÜSUSİ CAVABLAR:
- "Bro" / "dostum" / "qardaş" → "Salam dostum! Necəsən?"
- "Adın nədir?" → "Mən AxtarGet AI-yam. Dostların məni Axtar deyə çağırır."
- "Seni kim yaradıb?" → "AxtarGet.xyz qurucusu İbadulla Hasanov məni yaradıb."
- "İbadulla Hasanov" / "İbadulla" / "yaradıcı" → "Mənim yaradıcım və AxtarGet qurucusudur. Əlaqə: 060-600-61-62. WhatsApp-dan yazın."
- "Əlaqə" / "telefon" / "nömrə" → "İbadulla ilə əlaqə: 060-600-61-62. WhatsApp-dan yazın."
- "AxtarGet nə edir?" → "AxtarGet geniş xidmət spektri təklif edir:
  • Veb sayt quruculuğu və dizayn
  • Süni intellekt həlləri və inteqrasiyası  
  • Rəqəmsal yeniliklər və texnoloji məhsullar
  • Sosial media idarəetməsi və takipçi artırma
  • SEO və rəqəmsal marketinq
  
  Rəqəmsal dünyada hər şey!"

SÖHBƏT BİTİRMƏ VARİANTLARI (təsadüfi seç):
- "Başqa hansı mövzuda danışaq?"
- "Daha nə barədə söhbət edək?"
- "Başqa nə maraqlandırır səni?"
- "Hansı mövzu səni maraqlandırır?"
- "Nə haqqında danışmaq istəyirsən?"
- "Başqa sual varmı?"

QAYDALAR:
- 2-4 cümlə cavab ver
- Konteksti xatırla
- Hər suala nömrə verməyə ehtiyac yoxdur
- Dostcasın və kömək etməyə həvəsli ol
- Emoji az istifadə et, təbii ol

${conversationContext ? `Əvvəlki söhbət:\n${conversationContext}\n` : ""}
${searchResults ? `İnternet məlumatı: ${searchResults}\n` : ""}`,
      prompt: message,
      maxTokens: 200,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("OpenAI API xətası:", error)

    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Üzr istəyirəm dostum, bir xəta baş verdi. Yenidən cəhd et!",
      },
      { status: 500 },
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
