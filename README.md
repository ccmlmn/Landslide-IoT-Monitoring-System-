# Landslide IoT Monitoring System

A real-time IoT landslide monitoring system using ESP32 sensors, Python for data processing with Z-score anomaly detection, Convex for database, and Next.js with Clerk authentication for the dashboard.

## Architecture

```
ESP32 (Sensors) → Convex (HTTP Endpoint) → Database
                                              ↓
                                    Python Backend (Polls)
                                              ↓
                                    Z-Score Calculation
                                              ↓
                                    Convex (Anomaly Results)
                                              ↓
                                    Next.js Dashboard (Real-time)
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Convex account (https://convex.dev)
- Clerk account (https://clerk.com)

## Setup Instructions

### 1. Clone and Navigate

```bash
cd "MiniProject Data Scientist/Landslide IoT System"
```

### 2. Set Up Convex

```bash
cd web-app
npm install
npx convex dev
```

This will:

- Create a new Convex project (or link existing)
- Generate your `CONVEX_URL`
- Deploy your schema and functions

### 3. Set Up Clerk

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Get your API keys from the dashboard
4. Copy them for the next step

### 4. Configure Environment Variables

#### For Next.js (web-app/.env.local)

```bash
cd web-app
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

#### For Python Backend (backend/.env)

```bash
cd ../backend
cp .env.example .env
```

Edit `.env` with your Convex URL:

```env
CONVEX_URL=https://your-deployment.convex.cloud
POLL_INTERVAL=5
```

### 5. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
```

### 6. Run the System

You'll need 3 terminal windows:

#### Terminal 1: Convex Dev Server

```bash
cd web-app
npx convex dev
```

#### Terminal 2: Python Backend

```bash
cd backend
python app.py
```

#### Terminal 3: Next.js Dashboard

```bash
cd web-app
npm run dev
```

### 7. Test the System

Open a 4th terminal and send test sensor data:

```bash
cd backend
python test_esp32.py
```

Or manually with curl:

```bash
curl -X POST https://your-deployment.convex.site/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"rain_value": 45.5, "soil_moisture": 67.2, "tilt_value": 12.3}'
```

### 8. View the Dashboard

1. Open http://localhost:3000
2. Sign in with Clerk
3. See real-time sensor data and risk analysis

## Testing Without Hardware

Since you don't have the ESP32 hardware yet, use the test script:

```bash
cd backend
python test_esp32.py
```

This simulates the ESP32 sending sensor data to Convex at regular intervals.

## Project Structure

```
landslide-iot-system/
├── backend/
│   ├── app.py                 # Python processing server
│   ├── anomaly_detector.py    # Z-score calculation logic
│   ├── convex_client.py       # Convex API wrapper
│   ├── requirements.txt
│   ├── test_esp32.py          # Simulate ESP32 data
│   └── .env
├── web-app/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx           # Main dashboard page
│   ├── components/
│   │   ├── Dashboard.tsx      # Real-time dashboard
│   │   ├── Providers.tsx      # Clerk + Convex setup
│   │   └── ui/
│   │       └── card.tsx
│   ├── convex/
│   │   ├── schema.ts          # Database schema
│   │   ├── sensorData.ts      # CRUD operations
│   │   └── http.ts            # ESP32 HTTP endpoint
│   ├── middleware.ts          # Clerk auth middleware
│   └── .env.local
└── firmware/
    └── slope_sentry.ino       # ESP32 code (for later)
```

## How It Works

1. **ESP32** collects sensor data (rain, soil moisture, tilt)
2. **ESP32** sends data via HTTP POST to Convex endpoint
3. **Convex** stores raw sensor data in `sensorData` table
4. **Python backend** polls Convex every 5 seconds for unprocessed data
5. **Python** calculates Z-scores and risk percentage
6. **Python** saves results to `anomalyResults` table in Convex
7. **Next.js dashboard** subscribes to real-time updates from Convex
8. **Dashboard** displays current risk level, sensor values, and history

## API Endpoints

### Convex HTTP Endpoints

- `POST /sensor-data` - Receive sensor data from ESP32
- `GET /health` - Health check

### Convex Queries (React hooks)

- `getLatestResult` - Get most recent risk analysis
- `getLatestResults` - Get recent history
- `getUnprocessedData` - Get data needing processing
- `getAllSensorData` - Get all sensor readings

### Convex Mutations

- `addSensorData` - Add new sensor reading
- `addAnomalyResult` - Add risk analysis result
- `markAsProcessed` - Mark data as processed

## Troubleshooting

### Python can't connect to Convex

- Verify `CONVEX_URL` in `backend/.env`
- Make sure `npx convex dev` is running
- Check the URL format: `https://xxx.convex.cloud`

### Dashboard shows "Waiting for sensor data"

- Run the test script: `python backend/test_esp32.py`
- Check Python backend is running and processing data
- Verify Convex deployment is active

### Clerk authentication issues

- Verify API keys in `web-app/.env.local`
- Check Clerk dashboard for correct keys
- Ensure middleware.ts is properly configured

## Next Steps

1. ✅ Test skeleton code with simulated data
2. Build ESP32 hardware with sensors
3. Flash ESP32 with firmware code
4. Configure ESP32 with WiFi credentials
5. Refine dashboard UI/UX with your team
6. Add alerts and notifications
7. Deploy to production

## Contributing

This is a skeleton codebase. Your team can:

- Enhance the UI design
- Add more sophisticated risk algorithms
- Implement SMS/email alerts
- Add historical data visualization
- Create admin panel

## License

MIT
