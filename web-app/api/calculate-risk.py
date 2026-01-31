from http.server import BaseHTTPRequestHandler
import json
import os
try:
    from .anomaly_detector import AnomalyDetector
except ImportError:
    from anomaly_detector import AnomalyDetector

class handler(BaseHTTPRequestHandler):
    """Vercel serverless function to calculate risk score"""
    
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Extract sensor values
            rain = float(data.get('rainValue', 0.0))
            soil = float(data.get('soilMoisture', 0.0))
            tilt = float(data.get('tiltValue', 0.0))
            history = data.get('history', {})
            
            # Initialize detector with history if provided
            detector = AnomalyDetector(window_size=20)
            if history:
                detector.history = history
            
            # Calculate risk
            risk_score, risk_state, z_scores = detector.update_and_score(rain, soil, tilt)
            
            # Prepare response
            response = {
                "success": True,
                "data": {
                    "riskScore": risk_score,
                    "riskState": risk_state,
                    "zScores": z_scores,
                    "history": detector.history  # Return updated history
                }
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            # Error response
            error_response = {
                "success": False,
                "error": str(e)
            }
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
