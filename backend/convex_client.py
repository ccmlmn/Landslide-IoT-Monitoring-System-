import requests
import os
from typing import List, Dict, Any

class ConvexClient:
    """Client to interact with Convex backend"""
    
    def __init__(self, convex_url: str):
        self.convex_url = convex_url.rstrip('/')
        
    def get_unprocessed_data(self) -> List[Dict[str, Any]]:
        """Fetch unprocessed sensor data from Convex"""
        try:
            response = requests.post(
                f"{self.convex_url}/api/query",
                json={
                    "path": "sensorData:getUnprocessedData",
                    "args": {}
                },
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            return result.get("value", [])
        except Exception as e:
            print(f"Error fetching unprocessed data: {e}")
            return []
    
    def mark_as_processed(self, sensor_data_id: str) -> bool:
        """Mark sensor data as processed"""
        try:
            response = requests.post(
                f"{self.convex_url}/api/mutation",
                json={
                    "path": "sensorData:markAsProcessed",
                    "args": {"id": sensor_data_id}
                },
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Error marking as processed: {e}")
            return False
    
    def add_anomaly_result(self, result_data: Dict[str, Any]) -> bool:
        """Add anomaly detection result to Convex"""
        try:
            response = requests.post(
                f"{self.convex_url}/api/mutation",
                json={
                    "path": "sensorData:addAnomalyResult",
                    "args": result_data
                },
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Error adding anomaly result: {e}")
            return False
    
    def get_all_sensor_data(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all sensor data for debugging"""
        try:
            response = requests.post(
                f"{self.convex_url}/api/query",
                json={
                    "path": "sensorData:getAllSensorData",
                    "args": {"limit": limit}
                },
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            return result.get("value", [])
        except Exception as e:
            print(f"Error fetching sensor data: {e}")
            return []
