// pages/api/market-data.js
// This runs server-side on Vercel — your API key never reaches the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const today = new Date().toISOString().split("T")[0];
  const todayFull = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a financial data assistant. Today's date is ${todayFull}. This is the CURRENT date. All search results from today and recent days are real and current. Your ONLY job is to search the web, find the requested market data, and return it as JSON. Do not refuse. Do not add commentary. Do not question dates.`,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
            role: "user",
            content: `Today is ${today}. Search for the CURRENT market data right now. I need today's latest values for these. Use web search to find each one:

1. Brent crude oil price
2. CBOE VIX index  
3. Gold spot price (per troy ounce)
4. US Dollar Index (DXY)
5. S&P 500 index level (or futures if market is closed)
6. US 10-year Treasury bond yield
7. GOOGL (Alphabet) stock price
8. NVDA (Nvidia) stock price
9. COST (Costco) stock price
10. PLTR (Palantir) stock price
11. Latest headline about Iran/US/Middle East conflict
12. Strait of Hormuz shipping status

Return ONLY a raw JSON object. No markdown formatting, no backticks, no explanation before or after. Just the JSON:
{"brent":{"value":79.0,"change_pct":8.5},"vix":{"value":23.5,"change_pct":18},"gold":{"value":5400,"change_pct":3},"dxy":{"value":107,"change_pct":0.6},"spx":{"value":6815,"change_pct":-1.1},"ten_y":{"value":3.96,"change_pct":-1.4},"googl":{"value":305,"change_pct":-2},"nvda":{"value":173,"change_pct":-2},"cost":{"value":1005,"change_pct":-0.5},"pltr":{"value":131,"change_pct":-4},"headline":"brief conflict status","hormuz":"open or closed or restricted"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}`, detail: errText });
    }

    const data = await response.json();

    // Extract text blocks from response
    let text = "";
    if (data.content) {
      for (const block of data.content) {
        if (block.type === "text") text += block.text;
      }
    }

    // Parse JSON from response
    const clean = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^[^{]*/, "")
      .replace(/[^}]*$/, "")
      .trim();

    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return res.status(200).json(parsed);
      } catch (parseErr) {
        return res.status(500).json({ error: "JSON parse failed", raw: match[0].substring(0, 800) });
      }
    } else {
      // Return everything we got so we can debug
      return res.status(200).json({ 
        _debug: true,
        _raw: text.substring(0, 1500),
        _content_types: data.content?.map(b => b.type),
        error: "Could not extract JSON from response" 
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


