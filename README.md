# Landslide IoT Monitoring System (Slope Sentry)

A comprehensive real-time IoT landslide monitoring system using ESP32 sensors, Python backend with Z-score based anomaly detection, Convex real-time database, and Next.js dashboard with Clerk authentication and role-based access control.

## Architecture

```
ESP32 (Sensors) → Convex (HTTP Endpoint) → Database
                                              ↓
                                    Python Backend (Polls)
                                              ↓
                            Hybrid Risk Assessment Engine
                        (Z-Score Statistics + Fixed Thresholds)
                                              ↓
                                    Convex (Anomaly Results + Reports)
                                              ↓
                                    Next.js Dashboard (Multi-page App)
                                              ↓
                          Role-Based Views (Admin / Community)
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

### 9. Set Up User Roles (Clerk Dashboard)

By default, all users have the `community` role. To grant admin access:

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → select a user → **Metadata**
3. In **Public Metadata**, add:
   ```json
   { "role": "admin" }
   ```
4. Save — the user will now see the Admin Dashboard on next sign-in.

### 10. View the Dashboard

1. Open http://localhost:3000
2. Sign in with Clerk
3. Navigate through the role-based pages:

   **Admin users see:**
   - **Overview**: Main dashboard with real-time sensor data and full risk analysis
   - **Live Monitoring**: Detailed sensor analytics with threshold visualization
   - **Alerts & Logs**: System alerts and event logs (in development)
   - **Reports Logs**: Review and manage community-submitted reports
   - **Settings**: System configuration (in development)

   **Community users see:**
   - **Overview**: Simplified risk dashboard
   - **Live Monitoring**: Live sensor readings
   - **Report Issue**: Submit ground observations (cracks, seepage, sounds, etc.)

## Project Structure

```
landslide-iot-system/
├── backend/
│   ├── app.py                 # Python processing server (main loop)
│   ├── anomaly_detector.py    # Hybrid Z-score + threshold detection logic
│   ├── convex_client.py       # Convex API wrapper
│   ├── requirements.txt       # Python dependencies
│   ├── test_esp32.py          # Simulate ESP32 data
│   └── .env
├── web-app/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Clerk/Convex providers
│   │   ├── page.tsx                # Main dashboard (role-aware Overview)
│   │   ├── globals.css             # Global styles
│   │   ├── live-monitoring/
│   │   │   └── page.tsx            # Live monitoring page (all roles)
│   │   ├── alerts-logs/
│   │   │   └── page.tsx            # Alerts & logs page (admin only)
│   │   ├── report/
│   │   │   └── page.tsx            # Community issue reporting page
│   │   ├── reports-logs/
│   │   │   └── page.tsx            # Admin view for all community reports
│   │   └── settings/
│   │       └── page.tsx            # Settings page (in development)
│   ├── components/
│   │   ├── AppLayout.tsx           # Shared layout with sidebar & header
│   │   ├── Dashboard.tsx           # Real-time dashboard with charts
│   │   ├── RoleGuard.tsx           # Client-side role-based route protection
│   │   ├── Providers.tsx           # Clerk + Convex setup
│   │   ├── Sidebar.tsx             # Base navigation sidebar
│   │   ├── admin/
│   │   │   └── AdminSidebar.tsx    # Admin navigation (all 5 pages)
│   │   ├── community/
│   │   │   └── CommunitySidebar.tsx # Community navigation (3 pages)
│   │   └── ui/
│   │       └── card.tsx            # Reusable card component
│   ├── convex/
│   │   ├── schema.ts               # Database schema (sensorData, anomalyResults, reports)
│   │   ├── sensorData.ts           # CRUD operations for sensor data
│   │   ├── anomalyResults.ts       # CRUD operations for risk analysis
│   │   ├── reports.ts              # Community report mutations & queries
│   │   └── http.ts                 # ESP32 HTTP endpoint
│   ├── lib/
│   │   ├── utils.ts                # Utility functions (cn helper)
│   │   └── clerk-roles.ts          # Server-side role helpers
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
8. **Role-based routing**: Clerk role (`admin` / `community`) determines the sidebar and accessible pages
9. **Admin dashboard** displays:
   - Combined risk level with color-coded status
   - Live sensor values (rain, soil moisture, tilt) with Z-scores
   - Interactive charts showing historical trends with threshold lines
   - Recent history of sensor readings
   - Access to Reports Logs for managing community submissions
10. **Community dashboard** displays:
    - Simplified risk overview
    - Live sensor readings
    - Report Issue form for submitting ground observations

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
- `api.reports.getAllReports` - Get all community reports (admin)
- `api.reports.getReportsByStatus` - Filter reports by status
- `api.reports.getRecentReports` - Get recent reports with limit
- `api.reports.getReportStats` - Get report count statistics

### Convex Mutations

- `api.sensorData.addSensorData` - Add new sensor reading
- `api.sensorData.markAsProcessed` - Mark data as processed
- `api.anomalyResults.addAnomalyResult` - Add risk analysis result
- `api.reports.submitReport` - Submit a new community report
- `api.reports.updateReportStatus` - Update report status (admin)

## Features

### Real-Time Monitoring

- Live sensor data updates every 5 seconds
- Instant risk level changes with color-coded status indicators
- WebSocket-based real-time updates via Convex
- Multi-page navigation with Overview, Live Monitoring, Alerts & Logs, Reports Logs, and Settings
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

### Role-Based Access Control (RBAC)

- **Two roles**: `admin` and `community` (default)
- Role stored in Clerk `publicMetadata.role`
- `RoleGuard` component restricts access to admin-only pages client-side
- `clerk-roles.ts` provides server-side role checking utilities
- **Admin Dashboard** — full access to all pages and data
- **Community Dashboard** — simplified monitoring + report submission

### Community Reporting

- Community members can submit ground-level observations via the **Report Issue** page
- **Report types**: Ground Crack, Water Seepage, Strange Sound, Unusual Movement, Falling Rocks, Other
- **Severity levels**: Low, Medium, High
- Optional location field for geolocation context
- Reports are stored in the `reports` Convex table with `Pending` status on creation
- **Admin Reports Logs** page allows admins to:
  - View all reports with severity and status badges
  - Filter reports by status (All / Pending / Reviewed / Resolved)
  - Update report status with optional admin notes
  - Track report statistics (totals, pending count, resolved count)

### Security & Authentication

- Clerk-based user authentication with UserButton component
- **Role-Based Access Control**: Admin and Community roles via Clerk public metadata
- `RoleGuard` client-side component for page-level protection
- Protected routes with Next.js middleware
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

## Future Improvements

- [ ] Build Alerts & Logs page with event history and filtering
- [ ] Develop Settings page for system configuration
- [ ] SMS/Email alert notifications
- [ ] Weather API integration for correlation
