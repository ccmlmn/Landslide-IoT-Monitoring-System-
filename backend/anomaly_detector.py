import numpy as np
from typing import Tuple, Dict, List

class AnomalyDetector:
    """Hybrid anomaly detection for landslide monitoring (Z-score + Fixed Thresholds)"""
    
    def __init__(self, window_size: int = 20):
        self.window_size = window_size
        # Store recent history for calculations
        self.history = {
            'rain': [],
            'soil': [],
            'tilt': []
        }
        
        # Define fixed threshold values (engineering/geological limits)
        self.thresholds = {
            'tilt': {
                'warning': 15.0,   # 15° = noticeable ground movement
                'danger': 25.0,    # 25° = imminent failure risk
                'unit': '°'
            },
            'soil': {
                'warning': 70.0,   # 70% = soil saturation beginning
                'danger': 85.0,    # 85% = pore pressure critical
                'unit': '%'
            },
            'rain': {
                'warning': 50.0,   # Moderate rainfall
                'danger': 75.0,    # Heavy rainfall
                'unit': ''
            }
        }

    def check_threshold_status(self, sensor_type: str, value: float) -> Dict:
        """Check if value exceeds fixed thresholds"""
        thresholds = self.thresholds.get(sensor_type, {})
        warning = thresholds.get('warning', float('inf'))
        danger = thresholds.get('danger', float('inf'))
        unit = thresholds.get('unit', '')
        
        if value >= danger:
            return {
                'status': 'danger',
                'level': 'High',
                'message': f'Exceeds danger threshold ({danger}{unit})'
            }
        elif value >= warning:
            return {
                'status': 'warning',
                'level': 'Moderate',
                'message': f'Exceeds warning threshold ({warning}{unit})'
            }
        else:
            return {
                'status': 'normal',
                'level': 'Low',
                'message': 'Within normal range'
            }

    def update_and_score(self, rain: float, soil: float, tilt: float) -> Tuple[float, str, Dict[str, float]]:
        """
        Hybrid approach: Calculates both Z-score (statistical) and checks fixed thresholds.
        Combines both methods for maximum safety.
        
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

        # === METHOD 1: Statistical Z-Scores ===
        z_rain = self._calculate_z(rain, self.history['rain'])
        z_soil = self._calculate_z(soil, self.history['soil'])
        z_tilt = self._calculate_z(tilt, self.history['tilt'])

        # Calculate statistical risk (average of absolute Z-scores)
        avg_z = (abs(z_rain) + abs(z_soil) + abs(z_tilt)) / 3.0
        statistical_risk = (avg_z / 3.0) * 100.0  # Map Z=3 to 100%
        
        # Boost statistical risk if ANY sensor exceeds 3 sigma
        if abs(z_tilt) > 3 or abs(z_soil) > 3:
            statistical_risk = 100.0
            
        statistical_risk = min(max(statistical_risk, 0), 100)
        
        # Determine statistical risk state
        if statistical_risk > 60:
            statistical_state = "High"
        elif statistical_risk > 30:
            statistical_state = "Moderate"
        else:
            statistical_state = "Low"

        # === METHOD 2: Fixed Threshold Checking ===
        threshold_status = {
            'rain': self.check_threshold_status('rain', rain),
            'soil': self.check_threshold_status('soil', soil),
            'tilt': self.check_threshold_status('tilt', tilt)
        }
        
        # Count danger and warning flags
        danger_count = sum(1 for s in threshold_status.values() if s['status'] == 'danger')
        warning_count = sum(1 for s in threshold_status.values() if s['status'] == 'warning')
        
        # Determine threshold-based risk
        if danger_count >= 1:  # ANY sensor in danger
            threshold_state = "High"
            threshold_risk = 100.0
        elif warning_count >= 2:  # Two or more sensors warning
            threshold_state = "High"
            threshold_risk = 80.0
        elif warning_count >= 1:  # One sensor warning
            threshold_state = "Moderate"
            threshold_risk = 50.0
        else:
            threshold_state = "Low"
            threshold_risk = 0.0

        # === HYBRID COMBINATION: Take the WORSE of both methods ===
        # For life-safety systems, we want to be conservative
        final_risk = max(statistical_risk, threshold_risk)
        
        # Final state is the worse of the two
        risk_states_priority = {"Low": 0, "Moderate": 1, "High": 2}
        final_state_priority = max(
            risk_states_priority[statistical_state],
            risk_states_priority[threshold_state]
        )
        final_state = [k for k, v in risk_states_priority.items() if v == final_state_priority][0]

        z_scores = {
            "rain": round(z_rain, 4),
            "soil": round(z_soil, 4),
            "tilt": round(z_tilt, 4)
        }

        return round(final_risk, 2), final_state, z_scores

    def _calculate_z(self, current: float, history: List[float]) -> float:
        """Calculate Z-score for a single sensor"""
        mean = np.mean(history)
        std = np.std(history)
        if std == 0: 
            return 0.0  # Avoid division by zero
        return (current - mean) / std

    def get_threshold_data(self, rain: float, soil: float, tilt: float) -> Dict:
        """Get threshold status for all sensors"""
        return {
            'rain': self.check_threshold_status('rain', rain),
            'soil': self.check_threshold_status('soil', soil),
            'tilt': self.check_threshold_status('tilt', tilt)
        }
    
    def get_thresholds(self) -> Dict:
        """Get configured threshold values"""
        return self.thresholds
    
    def get_rolling_mean(self) -> Dict:
        """Get current rolling mean for all sensors"""
        return {
            'rain': float(np.mean(self.history['rain'])) if self.history['rain'] else 0.0,
            'soil': float(np.mean(self.history['soil'])) if self.history['soil'] else 0.0,
            'tilt': float(np.mean(self.history['tilt'])) if self.history['tilt'] else 0.0
        }
