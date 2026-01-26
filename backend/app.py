from flask import Flask, request, jsonify, render_template
import sqlite3
import datetime
import math
import numpy as np

app = Flask(__name__)
DB_NAME = "slope_sentry.db"

# --- Z-SCORE ANOMALY DETECTION LOGIC ---
class AnomalyDetector:
    def __init__(self, window_size=20):
        self.window_size = window_size
        # Store recent history for calculations
        self.history = {
            'rain': [],
            'soil': [],
            'tilt': []
        }

    def update_and_score(self, rain, soil, tilt):
        """
        Calculates Z-score for each sensor and returns a combined risk %.
        Uses a rolling window of the last N readings.
        """
        # Add new data
        self.history['rain'].append(rain)
        self.history['soil'].append(soil)
        self.history['tilt'].append(tilt)

        # Keep only last N records
        for key in self.history:
            if len(self.history[key]) > self.window_size:
                self.history[key].pop(0)

        # Need enough data to calculate std dev
        if len(self.history['rain']) < 5:
            return 0, "Initializing"

        # Calculate Z-Scores
        # Z = (Current - Mean) / StdDev
        z_rain = self._calculate_z(rain, self.history['rain'])
        z_soil = self._calculate_z(soil, self.history['soil'])
        z_tilt = self._calculate_z(tilt, self.history['tilt'])

        # --- RULE-BASED RISK CALCULATION ---
        # 1. We take the absolute Z-score (deviation from normal)
        # 2. We weight them (Rain & Tilt are critical)
        # 3. Map to percentage. 
        #    Assumption: Z=3 (3 sigma) is very high risk (100%)
        
        # Initial simple fusion: Average of absolute Z-scores
        avg_z = (abs(z_rain) + abs(z_soil) + abs(z_tilt)) / 3.0
        
        # Map Z (0 to 3) to Risk (0 to 100%)
        # If Z >= 3, risk is 100%. 
        risk_percentage = (avg_z / 3.0) * 100.0
        
        # Boost risk if ANY individual sensor is critically high
        if abs(z_tilt) > 3 or abs(z_soil) > 3:
            risk_percentage = 100.0
            
        risk_percentage = min(max(risk_percentage, 0), 100) # Clamp 0-100

        # Determine State
        risk_state = "Low"
        if risk_percentage > 60:
            risk_state = "High"
        elif risk_percentage > 30:
            risk_state = "Moderate"

        return round(risk_percentage, 2), risk_state

    def _calculate_z(self, current, history):
        mean = np.mean(history)
        std = np.std(history)
        if std == 0: return 0 # Avoid division by zero
        return (current - mean) / std

detector = AnomalyDetector()

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            rain_value REAL,
            soil_moisture REAL,
            tilt_value REAL,
            risk_score REAL,
            risk_state TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/sensor-data', methods=['POST'])
def receive_data():
    try:
        data = request.json
        rain = float(data.get('rain_value', 0))
        soil = float(data.get('soil_moisture', 0))
        tilt = float(data.get('tilt_value', 0))

        # Calculate Risk
        risk_score, risk_state = detector.update_and_score(rain, soil, tilt)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Save to DB
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('''
            INSERT INTO sensor_data (timestamp, rain_value, soil_moisture, tilt_value, risk_score, risk_state)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (timestamp, rain, soil, tilt, risk_score, risk_state))
        conn.commit()
        conn.close()

        print(f"Recorded: Rain={rain}, Soil={soil}, Tilt={tilt} -> Risk={risk_state} ({risk_score}%)")
        
        return jsonify({"status": "success", "risk_state": risk_state}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/history', methods=['GET'])
def get_history():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Access columns by name
    c = conn.cursor()
    # Get last 50 records
    c.execute('SELECT * FROM sensor_data ORDER BY id DESC LIMIT 50')
    rows = c.fetchall()
    conn.close()
    
    data = [dict(row) for row in rows]
    return jsonify(data) # Returns data latest first

@app.route('/api/latest', methods=['GET'])
def get_latest():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1')
    row = c.fetchone()
    conn.close()
    
    if row:
        return jsonify(dict(row))
    else:
        return jsonify({})

if __name__ == '__main__':
    # Run on all interfaces so ESP32 can connect
    app.run(host='0.0.0.0', port=5000, debug=True)
