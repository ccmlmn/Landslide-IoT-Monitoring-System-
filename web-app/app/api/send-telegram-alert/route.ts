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
    const { riskState, riskScore, rainValue, soilMoisture, tiltValue, timestamp, location, deviceId } = body;

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

    // Determine affected site and evacuation site dynamically
    const locationStr: string = location ?? "Unknown Location";
    let affectedSite = locationStr;
    let evacuateTo = "a safe location";

    const siteAMatch = /site\s*a/i.test(locationStr);
    const siteBMatch = /site\s*b/i.test(locationStr);

    if (siteAMatch) {
      affectedSite = "Site A";
      evacuateTo = "Site B";
    } else if (siteBMatch) {
      affectedSite = "Site B";
      evacuateTo = "Site A";
    }

    const message = [
      `🚨 <b>LANDSLIDE HIGH RISK ALERT</b> 🚨`,
      ``,
      `⚠️ <b>Risk Level:</b> HIGH`,
      `📊 <b>Risk Score:</b> ${(riskScore).toFixed(1)}%`,
      ``,
      `📍 <b>Location:</b> ${affectedSite}`,
      ``,
      `🕒 <b>Time (MYT):</b> ${time}`,
      ``,
      `⚡ Immediate action may be required! Please evacuate to ${evacuateTo} to ensure safety.`,
    ].join("\n");

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
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
