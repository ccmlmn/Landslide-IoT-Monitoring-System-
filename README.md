# Landslide IoT Monitoring System (Slope Sentry)

A comprehensive real-time IoT landslide monitoring system using ESP32 sensors, Python backend with Z-score based anomaly detection, Convex real-time database, and Next.js dashboard with Clerk authentication.

## Architecture

```
ESP32 (Sensors) → Convex (HTTP Endpoint) → Database
                                              ↓
                                    Python Backend (Polls)
                                              ↓
                            Hybrid Risk Assessment Engine
                        (Z-Score Statistics + Fixed Thresholds)
                                              ↓
                                    Convex (Anomaly Results)
                                              ↓
                                    Next.js Dashboard (Multi-page App)
                                              ↓
                                    Real-time Charts & Navigation
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
CONVEX_URL_CLOUD =https://your-deployment.convex.cloud
CONVEX_URL_SITE =https://your-deployment.convex.site

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

Note: The project also includes a `pyproject.toml` file for modern Python dependency management with additional packages like Flask (for future API endpoints).

### 6. Run the System

You'll need 2 terminal windows:

#### Terminal 1: Convex Dev Server

```bash
cd web-app
npx convex dev
```

#### Terminal 2: Next.js Dashboard

```bash
cd web-app
npm run dev
```

### 7. Test the System (If no hardware build yet)

Open a 3rd terminal and send test sensor data:
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
3. Select board: "ESP32 DEVKIT V1"
4. Connect ESP32 and upload

### 9. View the Dashboard

1. Open http://localhost:3000
2. Sign in with Clerk
3. Navigate through multiple pages:
   - **Overview**: Main dashboard with real-time sensor data and risk analysis
   - **Live Monitoring**: Dedicated live sensor monitoring page (coming soon)
   - **Alerts & Logs**: System alerts and event logs (coming soon)
   - **Settings**: System configuration and preferences (coming soon)

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
│   │   ├── layout.tsx              # Root layout with Clerk/Convex providers
│   │   ├── page.tsx                # Main dashboard (Overview)
│   │   ├── globals.css             # Global styles
│   │   ├── live-monitoring/
│   │   │   └── page.tsx            # Live monitoring page
│   │   ├── alerts-logs/
│   │   │   └── page.tsx            # Alerts & logs page
│   │   └── settings/
│   │       └── page.tsx            # Settings page
│   ├── components/
│   │   ├── AppLayout.tsx           # Shared layout with sidebar & header
│   │   ├── Dashboard.tsx           # Real-time dashboard with charts
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── Providers.tsx           # Clerk + Convex setup
│   │   └── ui/
│   │       └── card.tsx            # Reusable card component
│   ├── convex/
│   │   ├── schema.ts               # Database schema (sensorData, anomalyResults)
│   │   ├── sensorData.ts           # CRUD operations for sensor data
│   │   ├── anomalyResults.ts       # CRUD operations for risk analysis
│   │   └── http.ts                 # ESP32 HTTP endpoint
│   ├── lib/
│   │   └── utils.ts                # Utility functions (cn helper)
│   ├── middleware.ts               # Clerk auth middleware
│   ├── package.json                # Node.js dependencies
│   └── .env.local
├── firmware/
│   └── slope_sentry.ino            # ESP32 code with sensor integration
├── pyproject.toml                  # Python project configuration
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
5. **Python** applies hybrid risk assessment using dual methods:

   **Method A - Statistical Z-Score:**
   - Maintains rolling window of last 20 readings for each sensor
   - Calculates mean and standard deviation
   - Computes Z-score: `Z = (Current - Mean) / StdDev`
   - Maps to statistical risk percentage (Z=3 sigma = 100% risk)

   **Method B - Fixed Thresholds:**
   - Compares each sensor value against warning/danger thresholds
   - Tilt: 15°/25°, Soil: 70%/85%, Rain: 50/75
   - Determines threshold-based risk level

   **Hybrid Combination:**
   - Takes the WORSE result from both methods (conservative fail-safe)
   - Classifies final risk as Low (<30%), Moderate (30-60%), or High (>60%)

6. **Python** saves comprehensive results to `anomalyResults` table in Convex:
   - Risk scores, Z-scores, threshold status, rolling averages
7. **Next.js dashboard** subscribes to real-time updates from Convex
8. **Overview Dashboard** displays:
   - Combined risk level with color-coded status
   - Live sensor values (rain, soil moisture, tilt)
   - Interactive charts showing historical trends
   - Recent history of sensor readings with Z-scores
   - Timestamp and location information
9. **Live Monitoring Page** shows detailed analytics:
   - Individual sensor cards with threshold status
   - Warning and danger threshold lines on charts
   - Rolling mean visualization
   - Both Z-score and threshold-based analysis

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
- Multi-page navigation with Overview, Live Monitoring, Alerts & Logs, and Settings
- Mobile-responsive sidebar with hamburger menu

### Intelligent Risk Analysis

- **Hybrid Detection System**: Combines statistical and threshold-based approaches for maximum safety
  - **Z-Score Analysis**: Statistical anomaly detection using rolling window (20 readings)
  - **Fixed Thresholds**: Engineering/geological safety limits for each sensor
- **Conservative Fail-Safe**: Takes the WORSE result from both methods
- Multi-sensor data fusion (rain, soil moisture, tilt)
- Three-tier risk classification: Low, Moderate, High
- Individual sensor Z-scores and threshold status tracking
- **Threshold Values**:
  - **Tilt**: Warning 15°, Danger 25° (geological instability limits)
  - **Soil Moisture**: Warning 70%, Danger 85% (saturation/liquefaction)
  - **Rain**: Warning 50, Danger 75 (intensity thresholds)

### Interactive Dashboard

- **Multi-page Application**:
  - **Overview**: Main dashboard with combined risk assessment
  - **Live Monitoring**: Detailed sensor analytics with threshold visualization
  - **Alerts & Logs**: Event history and notifications (coming soon)
  - **Settings**: System configuration (coming soon)
- **Responsive Layout**: Mobile-first design with collapsible sidebar and hamburger menu
- **Real-time Charts**: Interactive sensor trends with threshold lines and rolling averages
- **Threshold Visualization**: Warning and danger lines on all charts
- **Header Bar**: Shows online status, last updated time, dark mode toggle, and user profile
- **Navigation Sidebar**: Easy access to all sections with active page highlighting
- **Color-coded Cards**: Sensor status cards change color based on threshold breach
- **Dual Method Display**: Shows both Z-scores and threshold status for each sensor
- **Loading States**: Skeleton screens for better UX during data fetching

### Hardware Integration

- Multiple sensor types: rain, soil moisture, tilt
- Visual alerts with LEDs for each sensor
- Audible alerts via buzzer
- WiFi connectivity for remote monitoring
- JSON-based data transmission

### Security & Authentication

- Clerk-based user authentication with UserButton component
- Protected routes with middleware
- Secure environment variable management
- HTTPS communication
- Session management across all pages

## Hybrid Risk Assessment Algorithm

The system uses a **dual-method approach** for maximum safety, combining statistical and threshold-based detection:

### Method 1: Statistical Z-Score Analysis

1. **Rolling Window**: Maintains last 20 readings for each sensor
2. **Z-Score Calculation**: `Z = (Current - Mean) / StdDev`
3. **Statistical Risk**:
   - Averages absolute Z-scores from all sensors
   - Maps Z-score (0-3) to risk percentage (0-100%)
   - Z ≥ 3 (3 standard deviations) = 100% risk
4. **Advantage**: Detects rapid changes and unusual patterns
5. **Use Case**: Catches sudden acceleration even if values are still "safe"

### Method 2: Fixed Threshold Checking

1. **Predefined Limits**: Based on engineering/geological safety standards
   - **Tilt**: Warning 15°, Danger 25°
   - **Soil Moisture**: Warning 70%, Danger 85%
   - **Rain**: Warning 50, Danger 75
2. **Threshold Risk**:
   - Danger (any sensor) = 100% risk
   - Warning (2+ sensors) = 80% risk
   - Warning (1 sensor) = 50% risk
3. **Advantage**: Respects absolute physical limits
4. **Use Case**: Prevents exceeding structural failure points

### Hybrid Combination Logic

```python
# Conservative fail-safe approach
final_risk = max(statistical_risk, threshold_risk)
final_state = worse_of(statistical_state, threshold_state)
```

**Why Both Methods?**

- **Z-Score catches**: Sudden changes, early warnings, rate of change
- **Thresholds catch**: Slow creep, absolute danger levels, engineering limits
- **Combined**: Maximum safety for life-critical landslide detection

### Risk Classification

- **Low**: 0-30% risk (Green) - Both methods agree it's safe
- **Moderate**: 30-60% risk (Yellow) - One method detects concern
- **High**: 60-100% risk (Red) - Either method detects danger

### Example Scenarios

1. **Rapid Acceleration**: Tilt 2° → 8° (Z=4.5, but <15°)
   - Z-Score: HIGH | Threshold: NORMAL → **Final: HIGH**
2. **Slow Creep**: Tilt gradually increases to 26°
   - Z-Score: NORMAL | Threshold: HIGH → **Final: HIGH**
3. **Normal Operation**: Stable readings within limits
   - Z-Score: NORMAL | Threshold: NORMAL → **Final: NORMAL**

## Troubleshooting

### Python can't connect to Convex

- Verify `CONVEX_URL` in `backend/.env`
- Make sure `npx convex dev` is running

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

- [ ] Build Alerts & Logs page with event history and filtering
- [ ] Develop Settings page for system configuration
- [ ] SMS/Email alert notifications
- [ ] Weather API integration for correlation
- [ ] Customizable risk thresholds
- [ ] Geolocation mapping with risk zones
