"""
Flask Web Server for Real-Time Sensor Processing
=================================================
This replaces the polling-based app.py with a web server that processes
sensor data immediately when requested.

HOW IT WORKS:
1. Convex HTTP endpoint receives ESP32 data
2. Convex calls THIS server: POST /process
3. This server calculates risk using AnomalyDetector
4. Returns result to Convex
5. Convex stores in database and replies to ESP32

BENEFITS:
- ESP32 gets result for the SAME reading it sent (not old data)
- No polling waste (only processes when data arrives)
- Free (no WebSocket subscription needed)
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from convex_client import ConvexClient
from anomaly_detector import AnomalyDetector

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# CORS: Allow Convex to call this server from a different domain
# Think of this like: "Yes, I accept phone calls from Convex's number"
CORS(app)

# Initialize once when server starts (not with every request)
CONVEX_URL = os.getenv("CONVEX_URL")
convex_client = ConvexClient(CONVEX_URL) if CONVEX_URL else None

# AnomalyDetector keeps history of readings in memory
# This persists across requests (same detector for all calls)
detector = AnomalyDetector(window_size=20)

print("=" * 60)
print("🚀 Flask Processing Server Starting")
print("=" * 60)
print(f"Convex URL: {CONVEX_URL}")
print(f"Endpoint: POST /process")
print(f"Ready to receive processing requests!")
print("=" * 60)


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint - verify server is running
    
    USAGE: Visit http://localhost:5000/health in browser
    RETURNS: {"status": "ok", "message": "Server is running"}
    """
    return jsonify({
        "status": "ok",
        "message": "Processing server is running",
        "detector_history_size": len(detector.history)
    }), 200


@app.route('/process', methods=['POST'])
def process_sensor_data():
    """
    Main processing endpoint - called by Convex
    
    REQUEST BODY (JSON):
    {
        "sensorDataId": "abc123",      // ID from Convex database
        "timestamp": "2026-02-09...",
        "rainValue": 45.5,
        "soilMoisture": 67.2,
        "tiltValue": 12.3
    }
    
    RESPONSE (JSON):
    {
        "success": true,
        "riskScore": 27.3,
        "riskState": "Low",              // "Low", "Moderate", or "High"
        "zScores": {
            "rain": 0.5,
            "soil": -0.2,
            "tilt": 0.1
        }
    }
    
    HOW IT PROCESSES:
    1. Receives sensor data from Convex
    2. Uses AnomalyDetector to calculate Z-scores
    3. Converts Z-scores to risk percentage
    4. Determines risk state (Low/Moderate/High)
    5. Returns result immediately
    """
    try:
        # Parse JSON data from request body
        data = request.get_json()
        
        # Validate: Make sure all required fields exist
        required_fields = ['rainValue', 'soilMoisture', 'tiltValue', 'sensorDataId', 'timestamp']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400  # 400 = Bad Request
        
        # Extract values
        rain = float(data['rainValue'])
        soil = float(data['soilMoisture'])
        tilt = float(data['tiltValue'])
        sensor_id = data['sensorDataId']
        timestamp = data['timestamp']
        
        print(f"\n📊 Processing request for {sensor_id[:8]}...")
        print(f"   Rain: {rain}, Soil: {soil}, Tilt: {tilt}")
        
        # 🧮 THE MAGIC HAPPENS HERE
        # AnomalyDetector:
        # 1. Adds this reading to history (keeps last 20)
        # 2. Calculates mean and std deviation from history
        # 3. Calculates Z-scores: (value - mean) / std_dev
        # 4. Converts Z-scores to risk percentage
        risk_score, risk_state, z_scores = detector.update_and_score(rain, soil, tilt)
        
        print(f"   ✓ Risk: {risk_state} ({risk_score:.1f}%)")
        print(f"   Z-scores: Rain={z_scores['rain']:.2f}, "
              f"Soil={z_scores['soil']:.2f}, "
              f"Tilt={z_scores['tilt']:.2f}")
        
        # Prepare response
        result = {
            "success": True,
            "riskScore": float(risk_score),
            "riskState": risk_state,
            "zScores": {
                "rain": float(z_scores['rain']),
                "soil": float(z_scores['soil']),
                "tilt": float(z_scores['tilt'])
            },
            # Include original data for storage
            "sensorDataId": sensor_id,
            "timestamp": timestamp,
            "rainValue": float(rain),
            "soilMoisture": float(soil),
            "tiltValue": float(tilt)
        }
        
        # Return 200 OK with result
        return jsonify(result), 200
        
    except ValueError as e:
        # Value error = data format issue (e.g., "abc" instead of number)
        print(f"   ✗ Value error: {e}")
        return jsonify({
            "success": False,
            "error": f"Invalid data format: {str(e)}"
        }), 400
        
    except Exception as e:
        # Unexpected error - return 500 Internal Server Error
        print(f"   ✗ Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/stats', methods=['GET'])
def get_statistics():
    """
    Debug endpoint - view detector statistics
    
    USAGE: Visit http://localhost:5000/stats
    RETURNS: Current history size, mean values, std deviations
    """
    history = detector.history
    
    if not history:
        return jsonify({
            "message": "No data processed yet",
            "history_size": 0
        }), 200
    
    # Calculate statistics from current history
    rain_values = [h['rain'] for h in history]
    soil_values = [h['soil'] for h in history]
    tilt_values = [h['tilt'] for h in history]
    
    import statistics
    
    return jsonify({
        "history_size": len(history),
        "statistics": {
            "rain": {
                "mean": statistics.mean(rain_values),
                "stdev": statistics.stdev(rain_values) if len(rain_values) > 1 else 0
            },
            "soil": {
                "mean": statistics.mean(soil_values),
                "stdev": statistics.stdev(soil_values) if len(soil_values) > 1 else 0
            },
            "tilt": {
                "mean": statistics.mean(tilt_values),
                "stdev": statistics.stdev(tilt_values) if len(tilt_values) > 1 else 0
            }
        }
    }), 200


# Error handlers
@app.errorhandler(404)
def not_found(e):
    """Handle 404 Not Found errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "available_endpoints": ["/health", "/process", "/stats"]
    }), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 Internal Server errors"""
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


if __name__ == '__main__':
    # Start Flask development server
    # host='0.0.0.0' = Accept connections from any IP (not just localhost)
    # port=5000 = Run on port 5000
    # debug=True = Auto-restart when code changes + detailed error messages
    
    app.run(
        host='0.0.0.0',  # Allow external connections (important for Convex to reach us)
        port=5000,
        debug=True       # Development mode - remove in production
    )
