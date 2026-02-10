# Landslide IoT Monitoring System (Slope Sentry)

A comprehensive real-time IoT landslide monitoring system using ESP32 sensors, Python backend with Z-score based anomaly detection, Convex real-time database, and Next.js dashboard with Clerk authentication.

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
                                    Next.js Dashboard (Real-time Charts)
```

## Hardware Components

- **ESP32 Development Board** (DOIT DevKit V1)
- **Rain Sensor** (Analog Pin 34 + Digital Pin 14)
- **Capacitive Soil Moisture Sensor** (Analog Pin 32)
- **MPU6050 Accelerometer/Gyroscope** (I2C Pins 21, 22)
- **3x Alert LEDs** (Pins 17, 5, 18)
- **Buzzer** (Pin 19) for audible alerts

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Convex account (https://convex.dev)
- Clerk account (https://clerk.com)
- (Optional) ESP32 with sensors for hardware deployment

## Setup Instructions

### 1. Clone and Navigate

```bash
cd Landslide IoT System
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

Python dependencies:

- `requests==2.31.0` - HTTP client for Convex API
- `numpy==1.26.4` - Numerical computing for Z-score calculations
- `python-dotenv==1.0.1` - Environment variable management

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

### 7. Test the System (If no hardware build yet)

Open a 4th terminal and send test sensor data:
This simulates the ESP32 sending sensor data to Convex at regular intervals.

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

### 8. Configure ESP32 Firmware (Optional - for hardware deployment)

Edit `firmware/slope_sentry.ino`:

```cpp
const char *WIFI_SSID = "your-wifi-name";           // Update with your WiFi SSID
const char *WIFI_PASSWORD = "your-wifi-password";   // Update with your WiFi password
const char *SERVER_URL = "https://your-deployment.convex.site/sensor-data"; // Use your Convex URL
```

Upload to ESP32 using Arduino IDE:

1. Install ESP32 board support
2. Install required libraries: `Adafruit MPU6050`, `ArduinoJson`
3. Select board: "DOIT ESP32 DEVKIT V1"
4. Connect ESP32 and upload

### 9. View the Dashboard

1. Open http://localhost:3000
2. Sign in with Clerk
3. See real-time sensor data and risk analysis with interactive charts

## Project Structure

```
landslide-iot-system/
├── backend/
│   ├── app.py                 # Python processing server (main loop)
│   ├── anomaly_detector.py    # Z-score calculation logic
│   ├── convex_client.py       # Convex API wrapper
│   ├── requirements.txt       # Python dependencies
│   ├── test_esp32.py          # Simulate ESP32 data
│   └── .env
├── web-app/
│   ├── app/
│   │   ├── layout.tsx         # App layout with Clerk/Convex providers
│   │   ├── page.tsx           # Main dashboard page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── Dashboard.tsx      # Real-time dashboard with charts
│   │   ├── Providers.tsx      # Clerk + Convex setup
│   │   └── ui/
│   │       └── card.tsx       # Reusable card component
│   ├── convex/
│   │   ├── schema.ts          # Database schema (sensorData, anomalyResults)
│   │   ├── sensorData.ts      # CRUD operations for sensor data
│   │   ├── anomalyResults.ts  # CRUD operations for risk analysis
│   │   └── http.ts            # ESP32 HTTP endpoint
│   ├── lib/
│   │   └── utils.ts           # Utility functions (cn helper)
│   ├── middleware.ts          # Clerk auth middleware
│   ├── package.json           # Node.js dependencies
│   └── .env.local
├── firmware/
│   └── slope_sentry.ino       # ESP32 code with sensor integration
├── pyproject.toml             # Python project configuration
└── README.md
```

## Key Technologies

### Frontend

- **Next.js 16.1.4** - React framework with App Router
- **React 19.2.3** - UI library
- **Clerk 6.36.10** - Authentication and user management
- **Convex 1.31.6** - Real-time database client
- **Recharts 3.7.0** - Data visualization charts
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **TypeScript 5.9.3** - Type-safe JavaScript

### Backend

- **Python 3.11+** - Core processing engine
- **NumPy 1.26.4** - Statistical calculations
- **Requests 2.31.0** - HTTP client for Convex API
- **python-dotenv 1.0.1** - Environment configuration

### Hardware

- **ESP32** - WiFi-enabled microcontroller
- **Arduino Framework** - Firmware development
- **ArduinoJson** - JSON serialization
- **Adafruit MPU6050** - Accelerometer library
- **HTTPClient** - ESP32 HTTP communication

## How It Works

1. **ESP32** collects sensor data (rain, soil moisture, tilt) from multiple sensors
2. **ESP32** sends data via HTTP POST to Convex endpoint with WiFi connectivity
3. **Convex** stores raw sensor data in `sensorData` table
4. **Python backend** polls Convex every 5 seconds for unprocessed data
5. **Python** calculates Z-scores using a rolling window of 20 readings:
   - Calculates mean and standard deviation for each sensor
   - Computes Z-score: `Z = (Current - Mean) / StdDev`
   - Combines scores with weighted average
   - Maps to risk percentage (Z=3 sigma = 100% risk)
   - Classifies as Low (<30%), Moderate (30-60%), or High (>60%)
6. **Python** saves results to `anomalyResults` table in Convex
7. **Next.js dashboard** subscribes to real-time updates from Convex
8. **Dashboard** displays:
   - Current risk level with color-coded status
   - Live sensor values (rain, soil moisture, tilt)
   - Interactive charts showing historical trends
   - Recent history of sensor readings
   - Z-scores for each sensor
   - Timestamp and location information

## API Endpoints

### Convex HTTP Endpoints

- `POST /sensor-data` - Receive sensor data from ESP32
  - Accepts: `{ rain_value, soil_moisture, tilt_value }`
  - Returns: `{ status, id, message, riskState }`
- `GET /health` - Health check

### Convex Queries (for React hooks)

- `api.anomalyResults.getLatest` - Get most recent risk analysis
- `api.anomalyResults.getLatestResults` - Get recent history
- `api.sensorData.getUnprocessedData` - Get data needing processing
- `api.sensorData.getAll` - Get all sensor readings
- `api.sensorData.getLatest` - Get latest sensor reading

### Convex Mutations

- `api.sensorData.addSensorData` - Add new sensor reading
- `api.sensorData.markAsProcessed` - Mark data as processed
- `api.anomalyResults.addAnomalyResult` - Add risk analysis result

## Features

### Real-Time Monitoring

- Live sensor data updates every 5 seconds
- Instant risk level changes with color-coded status indicators
- WebSocket-based real-time updates via Convex

### Intelligent Risk Analysis

- Z-score based statistical anomaly detection
- Rolling window algorithm (20 readings)
- Multi-sensor data fusion (rain, soil moisture, tilt)
- Three-tier risk classification: Low, Moderate, High
- Individual sensor Z-scores tracking

### Interactive Dashboard

- Real-time charts showing sensor trends over time
- Historical data visualization with Recharts
- Recent activity feed with timestamps
- Color-coded risk status (Green/Yellow/Red)
- Responsive design for mobile and desktop

### Hardware Integration

- Multiple sensor types: rain, soil moisture, tilt
- Visual alerts with LEDs for each sensor
- Audible alerts via buzzer
- WiFi connectivity for remote monitoring
- JSON-based data transmission

### Security & Authentication

- Clerk-based user authentication
- Protected routes with middleware
- Secure environment variable management
- HTTPS communication

## Z-Score Algorithm Details

The system uses a statistical anomaly detection approach:

1. **Rolling Window**: Maintains last 20 readings for each sensor
2. **Z-Score Calculation**: `Z = (Current - Mean) / StdDev`
3. **Risk Mapping**:
   - Averages absolute Z-scores from all sensors
   - Maps Z-score (0-3) to risk percentage (0-100%)
   - Z ≥ 3 (3 standard deviations) = 100% risk
4. **Risk Classification**:
   - **Low**: 0-30% risk (Green)
   - **Moderate**: 30-60% risk (Yellow)
   - **High**: 60-100% risk (Red)
5. **Critical Triggers**: Automatic 100% risk if any sensor exceeds 3 sigma

## Troubleshooting

### Python can't connect to Convex

- Verify `CONVEX_URL` in `backend/.env`
- Make sure `npx convex dev` is running
- Check the URL format: `https://xxx.convex.site` (not `.cloud`)

### Dashboard shows "Waiting for sensor data"

- Run the test script: `python backend/test_esp32.py`
- Check Python backend is running and processing data
- Verify Convex deployment is active
- Check browser console for errors

### Clerk authentication issues

- Verify API keys in `web-app/.env.local`
- Check Clerk dashboard for correct keys
- Ensure middleware.ts is properly configured
- Clear browser cache and cookies

### ESP32 Connection Issues

- Verify WiFi credentials in firmware
- Check serial monitor for connection logs
- Ensure Convex URL is correct and accessible
- Test with `curl` command first

## Future Improvements

- [ ] Enhanced UI design with more visualizations
- [ ] Machine learning models for predictive analysis
- [ ] SMS/Email alert notifications via Twilio/SendGrid
- [ ] Admin panel for system configuration
- [ ] Weather API integration for correlation
- [ ] Customizable risk thresholds
- [ ] Geolocation mapping with risk zones
- [ ] Alert escalation workflows

## License

MIT
