import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();

// The message is sent with parse_mode: "HTML", so any value interpolated into it
// must be escaped. `location` is free-text configured on the device, and a stray
// "&" or "<" makes Telegram reject the whole message ("can't parse entities") —
// which would silently drop a high-risk alert.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
    const locationStr: string =
      typeof location === "string" && location.trim() !== ""
        ? location
        : "Unknown Location";
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

    // Guard against a missing/non-numeric score: calling .toFixed() on it would
    // throw and lose the alert entirely, which matters more than a precise number.
    const scoreText =
      typeof riskScore === "number" && Number.isFinite(riskScore)
        ? `${riskScore.toFixed(1)}%`
        : "unavailable";

    const message = [
      `🚨 <b>LANDSLIDE HIGH RISK ALERT</b> 🚨`,
      ``,
      `⚠️ <b>Risk Level:</b> HIGH`,
      `📊 <b>Risk Score:</b> ${scoreText}`,
      ``,
      `📍 <b>Location:</b> ${escapeHtml(affectedSite)}`,
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
