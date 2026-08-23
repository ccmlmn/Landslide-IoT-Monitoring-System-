<div align="center">

# 🏔️ Slope Sentry

**Real-time IoT landslide monitoring and early-warning system**

ESP32 sensor nodes → Convex real-time backend → hybrid risk engine → Next.js dashboard → Telegram alerts

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Convex](https://img.shields.io/badge/Convex-1.31-EE342F)](https://convex.dev)
[![Clerk](https://img.shields.io/badge/Clerk-6.36-6C47FF)](https://clerk.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-00979D?logo=arduino&logoColor=white)](https://www.espressif.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

Slope Sentry monitors slope stability in real time using distributed ESP32 sensor nodes measuring **rainfall**, **soil moisture**, and **ground tilt**. Every reading is scored by a **hybrid risk engine** that combines statistical anomaly detection (Z-score over a rolling window) with **fixed geological thresholds**, and always takes the _worse_ of the two — a deliberate fail-safe for a life-safety system.

Results stream live to a role-aware Next.js dashboard, and any transition into **High** risk fires an instant Telegram alert with evacuation guidance.

### Highlights

|                            |                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| ⚡ **Sub-second pipeline** | Risk is computed _inline_ in the Convex HTTP action the moment a node posts data — no polling delay |
| 🧠 **Hybrid detection**    | Z-score anomaly detection **+** engineering thresholds, combined conservatively (worst case wins)   |
| 🛡️ **Automatic failover**  | Python serverless scorer with a TypeScript in-database fallback, kept at behavioural parity         |
| 📡 **Multi-node**          | Multiple ESP32 units (Site A / Site B) tracked independently with per-device history and filtering  |
| 🗺️ **Live sensor map**     | Leaflet map with risk-coloured pulsing markers for every node                                       |
| 🚨 **Telegram alerting**   | Edge-triggered **per node** (fires only on that node's transition _into_ High), with evacuation guidance |
| 👥 **Role-based access**   | Clerk-backed `admin` / `community` roles with separate navigation, pages, and data depth            |
| 📝 **Community reporting** | Ground-truth observations from residents, triaged by admins through a status workflow               |

---

## Table of Contents

- [Demo](#demo)
- [Architecture](#architecture)
- [Risk Engine](#risk-engine)
- [Features by Role](#features-by-role)
- [Hardware](#hardware)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Firmware Setup](#firmware-setup)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Demo

<div align="center">
  <a href="https://youtu.be/Zo7_nkXqK9g">
    <img src="https://img.youtube.com/vi/Zo7_nkXqK9g/maxresdefault.jpg" alt="Slope Sentry — full system demo" width="700">
  </a>
  <p><em>▶️ Click to watch the full walkthrough</em></p>
</div>

The demo covers:

- Sign-in and role-based routing — Admin and Community dashboards side by side
- Live sensor readings streaming in from both nodes, with the risk level updating in real time
- The sensor map showing per-node risk state
- Threshold charts on Live Monitoring, with warning and danger reference lines
- A High-risk event triggering an instant Telegram alert
- Community report submission and admin triage in Reports Logs

---

## Architecture

```
┌──────────────┐   HTTPS POST    ┌───────────────────────────────────────────┐
│  ESP32 Node  │ ──────────────► │  Convex HTTP Action  /sensor-data         │
│  (Site A/B)  │  device_id      │                                           │
│              │  location       │  1. store raw reading  → sensorData       │
│ rain · soil  │  rain/soil/tilt │  2. load last 20 readings (per device)    │
│ tilt (MPU)   │                 │  3. score risk                            │
└──────────────┘                 │  4. persist result → anomalyResults       │
                                 │  5. alert on per-node High transition     │
                                 └─────────────────┬─────────────────────────┘
                                                   │
                       ┌───────────────────────────┴───────────────────────┐
                       ▼                                                   ▼
       ┌────────────────────────────────┐   fallback   ┌────────────────────────────┐
       │  PRIMARY                       │ ───────────► │  FALLBACK                  │
       │  Vercel Python function        │  on failure  │  Convex TS action          │
       │  /api/calculate-risk  (NumPy)  │              │  anomalyDetection.ts       │
       └────────────────────────────────┘              └────────────────────────────┘
                                                   │
                       ┌───────────────────────────┴───────────────────────┐
                       ▼                                                   ▼
       ┌────────────────────────────────┐              ┌────────────────────────────┐
       │  Next.js Dashboard             │              │  Telegram Bot API          │
       │  live WebSocket subscriptions  │              │  /api/send-telegram-alert  │
       │  Admin view  │  Community view │              │  (per node, on → High)     │
       └────────────────────────────────┘              └────────────────────────────┘
```

**Why this shape?** Scoring happens inside the ingest path, so the dashboard and the alert channel react to a reading in the same request that stores it.

**Per-node isolation.** Every lookup in the ingest path — rolling window, previous risk state, and the risk value echoed back to the device — is scoped by `device_id`. Each node therefore alerts on its own transition into High and drives its own buzzer, so one site being in danger neither suppresses nor triggers an alert for the other.

The standalone Python poller in [backend/](backend/) remains available for **local and offline processing during development**, but it is no longer required by the deployed pipeline.

---

## Risk Engine

Every reading is scored by two independent methods; the **worse** result wins.

### Method 1 — Statistical Z-Score

```
Z = (current − mean) / σ        over a rolling window of the last 20 readings
```

- Risk % maps `Z = 0…3` onto `0…100%` (3σ = 100%).
- The current sample is scored against **prior history only**, so an anomaly cannot dilute itself.
- Tilt or soil beyond **3σ** immediately escalates statistical risk to 100%.
- A node needs **4 prior readings** before Z-scores are meaningful; until then the statistical method contributes nothing and reports `Initializing`. Method 2 still applies — see below.
- **Catches:** sudden acceleration, early warnings, rate of change — _even while absolute values still look safe_.

### Method 2 — Fixed Thresholds

| Sensor            | Warning | Danger | Rationale                                          |
| ----------------- | ------- | ------ | -------------------------------------------------- |
| **Tilt**          | 15°     | 25°    | Noticeable ground movement → imminent failure risk |
| **Soil Moisture** | 70 %    | 85 %   | Saturation onset → critical pore pressure          |
| **Rainfall**      | 50      | 75     | Moderate → heavy rainfall intensity                |

| Condition                 | Threshold risk |
| ------------------------- | -------------- |
| Any sensor in **danger**  | 100 %          |
| **2+** sensors in warning | 80 %           |
| **1** sensor in warning   | 50 %           |
| All normal                | 0 %            |

- These limits need no history, so they are enforced **from the very first reading**. A node that boots up already past a danger limit reports `High` immediately rather than sitting at `Initializing` with 0% risk.
- **Catches:** slow creep and absolute physical limits that statistics would eventually treat as the "new normal".

### Hybrid Combination

```
final_risk  = max(statistical_risk, threshold_risk)
final_state = worse_of(statistical_state, threshold_state)
```

| State               | Score    | Colour | When                                                          |
| ------------------- | -------- | ------ | ------------------------------------------------------------- |
| ⚪ **Initializing** | 0 %      | Grey   | Fewer than 4 prior readings **and** no threshold breached     |
| 🟢 **Low**          | 0–30 %   | Green  |                                                               |
| 🟡 **Moderate**     | 30–60 %  | Amber  |                                                               |
| 🔴 **High**         | 60–100 % | Red    |                                                               |

> `Initializing` means "not enough history to judge statistically" — it never
> suppresses a threshold breach. Both the Python and TypeScript engines use the
> same 4-reading warm-up so a node scores identically whichever one serves the
> request.

### Worked scenarios

| Scenario                                                     | Z-Score | Threshold | **Final** |
| ------------------------------------------------------------ | ------- | --------- | --------- |
| Rapid acceleration — tilt 2° → 8° (Z ≈ 4.5, still under 15°) | HIGH    | Normal    | **HIGH**  |
| Slow creep — tilt drifts to 26° over days                    | Normal  | HIGH      | **HIGH**  |
| Stable readings within limits                                | Normal  | Normal    | **LOW**   |
| Node boots up already tilted 30° (no history yet)            | —       | HIGH      | **HIGH**  |
| First few readings, everything within limits                 | —       | Normal    | **INIT**  |

---

## Features by Role

Roles live in Clerk `publicMetadata.role`. Everyone defaults to `community`; access is enforced by Next.js middleware plus the `RoleGuard` component.

| Page                | Admin | Community | Description                                                                                                         |
| ------------------- | :---: | :-------: | ------------------------------------------------------------------------------------------------------------------- |
| **Overview**        |  ✅   |    ✅     | Live risk level, sensor cards, trend charts, sensor map. Admins additionally see Z-scores and multi-node comparison |
| **Live Monitoring** |  ✅   |    ✅     | Per-sensor charts with warning/danger reference lines; admins can filter by node or compare Site A against Site B   |
| **Alerts & Logs**   |  ✅   |     —     | Searchable, filterable, paginated alert history with detail modal and export                                        |
| **Reports Logs**    |  ✅   |     —     | Triage community reports: filter by status, update status, attach admin notes, view statistics                      |
| **Settings**        |  ✅   |     —     | Dark mode (persisted). Algorithm and threshold sliders are a **preview only** — see the note below                   |
| **Report Issue**    |   —   |    ✅     | Submit ground observations: crack, seepage, sound, movement, falling rocks, other — with severity and location      |

**Community reporting workflow:** submission → `Pending` → admin review → `Reviewed` / `Resolved`, with optional admin notes at each step.

> **Settings are not yet persisted.** Detection thresholds live in the analysis code
> ([`web-app/api/anomaly_detector.py`](web-app/api/anomaly_detector.py) and
> [`web-app/convex/anomalyDetection.ts`](web-app/convex/anomalyDetection.ts)), not in the
> database. The sliders on the Settings page reflect those values but do not change
> them, so the **Save Changes** button is disabled rather than silently doing nothing.
> To retune the system, edit the thresholds in **both** engines so they stay in sync.

---

## Hardware

| Component                                | Connection                                       |
| ---------------------------------------- | ------------------------------------------------ |
| ESP32 Development Board (DOIT DevKit V1) | —                                                |
| Rain Sensor                              | Analog `GPIO 34` + Digital `GPIO 14`             |
| Capacitive Soil Moisture Sensor          | Analog `GPIO 32`                                 |
| MPU6050 Accelerometer / Gyroscope        | I²C `SDA 21`, `SCL 22` (address `0x68` / `0x69`) |
| Alert LEDs (rain / soil / tilt)          | `GPIO 17`, `GPIO 5`, `GPIO 18`                   |
| Buzzer                                   | `GPIO 19`                                        |

Nodes are identified by `DEVICE_ID` (`ESP32-001` = Site A, `ESP32-002` = Site B) so the backend maintains a **separate rolling window per node**.

---

## Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.11+** (only for the optional local backend and the data simulator)
- A free [Convex](https://convex.dev) account
- A free [Clerk](https://clerk.com) account
- _(Optional)_ Telegram bot token and chat ID for alerts
- _(Optional)_ ESP32 hardware — the system runs fully on simulated data without it

### 1. Clone and install

```bash
git clone https://github.com/ccmlmn/Landslide-IoT-Monitoring-System-.git
cd "Landslide IoT System/web-app"
npm install
```

### 2. Provision Convex

```bash
npx convex dev
```

This creates (or links) a Convex project, deploys the schema and functions, and writes your deployment URL into `.env.local`.

### 3. Configure Clerk

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the **Publishable key** and **Secret key** into `web-app/.env.local` (see below).

### 4. Set environment variables

Create `web-app/.env.local` — the full list is in [Environment Variables](#environment-variables).

### 5. Run

Two terminals, both inside `web-app/`:

```bash
npx convex dev     # terminal 1 — Convex backend + live schema sync
npm run dev        # terminal 2 — Next.js dashboard on http://localhost:3000
```

### 6. Feed it data (no hardware needed)

```bash
cd backend
pip install -r requirements.txt
python test_esp32.py
```

Or post a single reading by hand:

```bash
curl -X POST https://<your-deployment>.convex.site/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"device_id":"ESP32-001","location":"Site A","rain_value":45.5,"soil_moisture":67.2,"tilt_value":12.3}'
```

### 7. Grant yourself admin

1. Clerk Dashboard → **Users** → select your user → **Metadata** → **Public metadata**
2. Add:
   ```json
   { "role": "admin" }
   ```
3. Save and sign in again — the Admin sidebar appears.

> 💡 Run `python test_setup.py` from the project root to verify Python dependencies and Convex connectivity.

---

## Environment Variables

### `web-app/.env.local` — Next.js

| Variable                            | Required | Description                                                              |
| ----------------------------------- | :------: | ------------------------------------------------------------------------ |
| `CONVEX_DEPLOYMENT`                 |    ✅    | Written automatically by `npx convex dev`                                |
| `NEXT_PUBLIC_CONVEX_URL`            |    ✅    | `https://<deployment>.convex.cloud`                                      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |    ✅    | Clerk publishable key (`pk_test_…`)                                      |
| `CLERK_SECRET_KEY`                  |    ✅    | Clerk secret key (`sk_test_…`)                                           |
| `TELEGRAM_BOT_TOKEN`                |    ⚪    | From [@BotFather](https://t.me/BotFather); alerts are skipped when unset |
| `TELEGRAM_CHAT_ID`                  |    ⚪    | Target chat, group, or channel ID for alerts                             |

### Convex Dashboard → Settings → Environment Variables

| Variable   |    Required     | Description                                                                                                                                                                                                                                                                   |
| ---------- | :-------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL` | ✅ _(deployed)_ | Public base URL of the Next.js app, e.g. `https://your-app.vercel.app` — **no trailing slash**. Convex uses it to reach `/api/calculate-risk` and `/api/send-telegram-alert`. Without it the pipeline silently falls back to the TypeScript scorer and skips Telegram alerts. |

### `backend/.env` — optional local Python processor

| Variable           | Description                         |
| ------------------ | ----------------------------------- |
| `CONVEX_URL_CLOUD` | `https://<deployment>.convex.cloud` |
| `CONVEX_URL_SITE`  | `https://<deployment>.convex.site`  |
| `POLL_INTERVAL`    | Seconds between polls (default `5`) |

> ⚠️ No `.env.example` templates are committed — create the files above by hand. All `.env*` files are git-ignored; never commit real keys.

---

## Firmware Setup

Edit the configuration block in [firmware/slope_sentry.ino](firmware/slope_sentry.ino):

```cpp
const char *WIFI_SSID     = "your-wifi-name";
const char *WIFI_PASSWORD = "your-wifi-password";
const char *SERVER_URL    = "https://<your-deployment>.convex.site/sensor-data";
const char *DEVICE_ID     = "ESP32-001";   // "ESP32-002" for the second unit
const char *LOCATION      = "Site A - Armani Cameron Residence";
```

Upload with the Arduino IDE:

1. Install **ESP32 board support** via Boards Manager.
2. Install the libraries **Adafruit MPU6050**, **Adafruit Unified Sensor**, and **ArduinoJson**.
3. Select board **ESP32 DEVKIT V1**, pick the serial port, and upload.
4. Open the Serial Monitor at **115200 baud** to confirm WiFi and MPU6050 initialisation.

The firmware also drives on-device LED and buzzer alerts, so a node keeps warning locally even if connectivity drops.

**Failure behaviour**

| Situation                | Node behaviour                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| MPU6050 not detected     | Presence is latched from `mpu.begin()` at boot. Tilt is not read and `CRITICAL: MPU6050 not found!` is logged; the rain and soil sensors keep working. |
| WiFi drops after boot    | `loop()` retries `WiFi.begin()` on each cycle, so the node rejoins on its own once the network returns.            |
| Server unreachable / bad response | The buzzer is driven LOW (fail-safe) rather than left in its previous state.                             |

> The tilt reading defaults to `0.0`, which looks identical to "perfectly stable ground".
> Check the serial log at boot to confirm the MPU6050 was actually detected before trusting a flat tilt trace.

---

## Deployment

The web app deploys to **Vercel**, which serves both the Next.js dashboard and the Python risk function — [web-app/vercel.json](web-app/vercel.json) wires up `@vercel/next` and `@vercel/python`.

1. Import the repository into Vercel with **root directory = `web-app`**.
2. Add every `web-app/.env.local` variable as a Vercel environment variable.
3. Deploy Convex to production: `npx convex deploy`.
4. In the **Convex dashboard**, set `SITE_URL` to your Vercel URL.
5. Point each ESP32's `SERVER_URL` at the production `.convex.site` endpoint.

Both `/api/calculate-risk` and `/api/send-telegram-alert` are declared **public routes** in [web-app/middleware.ts](web-app/middleware.ts) so Convex can call them without a Clerk session.

> ⚠️ **Known limitation.** Those two routes, and the Convex `/sensor-data` endpoint, accept
> unauthenticated requests. Anyone who learns the URLs can post fabricated sensor readings or
> trigger a Telegram alert. This is acceptable for a coursework demo but **must be addressed
> before any real deployment** — the usual fix is a shared secret header checked by the route
> and set alongside `SITE_URL` in the Convex dashboard, plus a per-device key for the ESP32.

---

## API Reference

### Convex HTTP endpoints

| Method | Path           | Body                                                               | Response                                        |
| ------ | -------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `POST` | `/sensor-data` | `{ device_id?, location?, rain_value, soil_moisture, tilt_value }` | `{ status, id, message, riskState, riskScore }` |
| `GET`  | `/health`      | —                                                                  | `{ status: "ok", service }`                     |

### Next.js API routes

| Method | Path                       | Purpose                                            |
| ------ | -------------------------- | -------------------------------------------------- |
| `POST` | `/api/calculate-risk`      | Python (NumPy) hybrid scorer — primary risk engine |
| `POST` | `/api/send-telegram-alert` | Formats and sends the High-risk Telegram alert     |

### Convex queries

| Function                                                                               | Purpose                                                  |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `sensorData.getLatestResult`                                                           | Latest risk result, optionally per `deviceId`            |
| `sensorData.getLatestResults`                                                          | Recent risk history with `limit` and optional `deviceId` |
| `sensorData.getLatestResultPerDevice`                                                  | Latest result for every node — powers the map            |
| `sensorData.getUnprocessedData`                                                        | Readings awaiting processing (local Python loop)         |
| `sensorData.getAllSensorData`                                                          | Raw sensor readings, for debugging                       |
| `anomalyResults.getLatest` / `getLatestByDevice` / `getAll`                            | Risk analysis history                                    |
| `reports.getAllReports` / `getReportsByStatus` / `getRecentReports` / `getReportStats` | Community reports and statistics                         |

### Convex mutations

| Function                      | Purpose                        |
| ----------------------------- | ------------------------------ |
| `sensorData.addSensorData`    | Store a raw sensor reading     |
| `sensorData.addAnomalyResult` | Persist a scored risk result   |
| `sensorData.markAsProcessed`  | Flag a reading as handled      |
| `reports.submitReport`        | Submit a community observation |
| `reports.updateReportStatus`  | Admin status update and notes  |

### Data model

| Table            | Key fields                                                                                                   | Indexes                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `sensorData`     | `timestamp`, `deviceId`, `location`, `rainValue`, `soilMoisture`, `tiltValue`, `processed`                   | `by_timestamp`, `by_processed`, `by_device`  |
| `anomalyResults` | sensor values, `riskScore`, `riskState`, per-sensor Z-scores, `thresholdStatus`, `thresholds`, `rollingMean` | `by_timestamp`, `by_risk_state`, `by_device` |
| `reports`        | `userName`, `userEmail`, `reportType`, `description`, `severity`, `status`, `adminNotes`                     | `by_timestamp`, `by_status`, `by_severity`   |

---

## Project Structure

```
Landslide IoT System/
├── firmware/
│   └── slope_sentry.ino            # ESP32: sensors, WiFi, local LED/buzzer alerts
│
├── web-app/                        # Next.js dashboard + Convex backend + Python API
│   ├── api/                        # Vercel Python serverless functions
│   │   ├── calculate-risk.py       #   → primary hybrid risk endpoint
│   │   └── anomaly_detector.py     #   → Z-score + threshold engine (NumPy)
│   ├── app/
│   │   ├── page.tsx                # Overview (role-aware) + sign-in screen
│   │   ├── live-monitoring/        # Per-sensor charts with threshold lines
│   │   ├── alerts-logs/            # Admin: alert history, search, export
│   │   ├── reports-logs/           # Admin: community report triage
│   │   ├── settings/               # Admin: algorithm, thresholds, devices, theme
│   │   ├── report/                 # Community: submit an observation
│   │   └── api/send-telegram-alert/route.ts
│   ├── components/
│   │   ├── Dashboard.tsx           # Live risk cards, charts, map
│   │   ├── SensorMap.tsx           # Leaflet map with risk-coloured markers
│   │   ├── AppLayout.tsx           # Sidebar + header shell
│   │   ├── RoleGuard.tsx           # Client-side role protection
│   │   ├── admin/AdminSidebar.tsx  # 5-page admin navigation
│   │   └── community/CommunitySidebar.tsx
│   ├── convex/
│   │   ├── schema.ts               # sensorData · anomalyResults · reports
│   │   ├── http.ts                 # /sensor-data ingest → risk → alert pipeline
│   │   ├── anomalyDetection.ts     # TypeScript fallback risk engine
│   │   └── sensorData.ts · anomalyResults.ts · reports.ts
│   ├── lib/clerk-roles.ts          # Server-side role helpers
│   ├── middleware.ts               # Clerk auth + public API routes
│   └── vercel.json                 # Next.js + Python build config
│
├── backend/                        # Optional local processing loop
│   ├── app.py                      # Poll → score → write back
│   ├── anomaly_detector.py         # Same hybrid algorithm
│   ├── convex_client.py            # Convex REST wrapper
│   └── test_esp32.py               # ESP32 data simulator
│
├── test_setup.py                   # Environment verification script
└── pyproject.toml                  # Python project config (uv)
```

---

## Tech Stack

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind CSS 4 · Recharts 3.7 · Leaflet / react-leaflet · Lucide React

**Backend** — Convex 1.31 (real-time DB, HTTP actions, WebSocket subscriptions) · Python 3.11 + NumPy on Vercel serverless · Clerk 6.36 for auth and RBAC

**Hardware** — ESP32 on the Arduino framework · Adafruit MPU6050 · ArduinoJson · HTTPClient

**Integrations** — Telegram Bot API · Vercel

---

## Known Limitations

Honest notes on what this build does **not** do yet. None of these block the demo,
but each matters before the system is trusted with real slopes.

| Area                       | Limitation                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint authentication** | `/sensor-data`, `/api/calculate-risk` and `/api/send-telegram-alert` accept unauthenticated requests. Fabricated readings and alerts are possible.        |
| **Settings persistence**   | Threshold and algorithm sliders are a preview; the real values are constants in the two engines. Save is disabled.                                       |
| **Duplicated risk engine** | `web-app/api/anomaly_detector.py` and `backend/anomaly_detector.py` are byte-identical copies, and `anomalyDetection.ts` re-implements the same logic. All three must be edited together. |
| **Fixed node registry**    | Site names, map coordinates, and the `ESP32-001` / `ESP32-002` IDs are hard-coded in ~15 places in the dashboard **and** in `sensorData.getLatestResultPerDevice`. A third node would not appear without code changes. |
| **Rain units**             | Rain is a unitless 0–100 sensor mapping, not a calibrated mm/hr rate; thresholds are relative rather than meteorological.                                  |
| **No automated tests**     | Despite the `test_*.py` filenames, [`test_setup.py`](test_setup.py) is a dependency/connectivity check and [`backend/test_esp32.py`](backend/test_esp32.py) is the data simulator. There is no unit-test suite; correctness rests on `tsc`, ESLint, and manual runs. |
| **Next.js 16 deprecation** | The `middleware.ts` convention is deprecated in favour of `proxy.ts`; it still works but emits a build warning.                                          |

---

## License

Released under the [MIT License](LICENSE) — © 2026 Umair Arif.

<div align="center">

**Protecting lives through intelligent disaster prediction**

</div>
