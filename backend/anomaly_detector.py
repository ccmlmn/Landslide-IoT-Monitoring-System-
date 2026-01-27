import numpy as np
from typing import Tuple, Dict, List

class AnomalyDetector:
    """Z-score based anomaly detection for landslide monitoring"""
    
    def __init__(self, window_size: int = 20):
        self.window_size = window_size
        # Store recent history for calculations
        self.history = {
            'rain': [],
            'soil': [],
            'tilt': []
        }

    def update_and_score(self, rain: float, soil: float, tilt: float) -> Tuple[float, str, Dict[str, float]]:
        """
        Calculates Z-score for each sensor and returns a combined risk %.
        Uses a rolling window of the last N readings.
        
        Returns:
            Tuple of (risk_percentage, risk_state, z_scores_dict)
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
            return 0.0, "Initializing", {"rain": 0.0, "soil": 0.0, "tilt": 0.0}

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

        z_scores = {
            "rain": round(z_rain, 4),
            "soil": round(z_soil, 4),
            "tilt": round(z_tilt, 4)
        }

        return round(risk_percentage, 2), risk_state, z_scores

    def _calculate_z(self, current: float, history: List[float]) -> float:
        """Calculate Z-score for a single sensor"""
        mean = np.mean(history)
        std = np.std(history)
        if std == 0: 
            return 0.0  # Avoid division by zero
        return (current - mean) / std
