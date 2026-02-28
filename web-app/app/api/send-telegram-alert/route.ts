import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();

export async function POST(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Telegram credentials not configured");
      return NextResponse.json(
        { error: "Telegram credentials not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { riskState, riskScore, rainValue, soilMoisture, tiltValue, timestamp } = body;

    const time = timestamp
      ? new Date(timestamp).toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          dateStyle: "medium",
          timeStyle: "short",
        });

    const message = [
      `🚨 *LANDSLIDE HIGH RISK ALERT* 🚨`,
      ``,
      `⚠️ *Risk Level:* HIGH`,
      `📊 *Risk Score:* ${(riskScore * 100).toFixed(1)}%`,
      ``,
      `Location: Site A`,
      ``,
      `🕒 *Time (MYT):* ${time}`,
      ``,
      `⚡ Immediate action may be required\\!. Please evacuate to Site B to ensure safety\\.`,
    ].join("\n");

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "MarkdownV2",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Telegram API error:", result);
      return NextResponse.json(
        { error: "Failed to send Telegram message", details: result },
        { status: 500 }
      );
    }

    console.log("Telegram alert sent successfully for riskState:", riskState);
    return NextResponse.json({ success: true, message: "Alert sent!" });
  } catch (error) {
    console.error("Telegram alert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
