from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# anomaly_detector.py sits next to this file and is shipped via the "includeFiles"
# entry in vercel.json. It is a plain module, not a second endpoint — only this
# file defines a `handler`, which is why vercel.json names this file explicitly
# instead of globbing api/**/*.py.
# Put this file's own directory on sys.path so the import resolves the same way
# locally, on Vercel, and under the test harness, rather than depending on
# whatever the runtime happens to set as the working directory.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
            
            # Initialize detector with history if provided.
            # Normalise it rather than assigning the raw payload: the detector
            # indexes all three keys, so a caller that omits one (or sends a
            # non-list) would otherwise blow up mid-calculation.
            detector = AnomalyDetector(window_size=20)
            if isinstance(history, dict):
                for key in ('rain', 'soil', 'tilt'):
                    values = history.get(key)
                    if isinstance(values, list):
                        detector.history[key] = [
                            float(v) for v in values
                            if isinstance(v, (int, float)) and not isinstance(v, bool)
                        ]
            
            # Calculate risk
            risk_score, risk_state, z_scores = detector.update_and_score(rain, soil, tilt)
            
            # Get threshold data and rolling means
            threshold_status = detector.get_threshold_data(rain, soil, tilt)
            thresholds = detector.get_thresholds()
            rolling_mean = detector.get_rolling_mean()
            
            # Prepare response
            response = {
                "success": True,
                "data": {
                    "riskScore": risk_score,
                    "riskState": risk_state,
                    "zScores": z_scores,
                    "history": detector.history,  # Return updated history
                    # New fields for hybrid approach
                    "thresholdStatus": threshold_status,
                    "thresholds": thresholds,
                    "rollingMean": rolling_mean
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
