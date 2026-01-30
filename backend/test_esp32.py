"""
Test script to simulate ESP32 sending sensor data to Convex
Run this to test your system without hardware
"""

import requests
import time
import random
import os
from dotenv import load_dotenv

load_dotenv()

# Your Convex deployment URL
CONVEX_URL = os.getenv("CONVEX_URL", "https://your-deployment.convex.cloud")

def send_sensor_data():
    """Simulate ESP32 sending sensor data"""
    
    # Generate realistic random sensor values
    rain_value = random.uniform(0, 100)  # 0-100 mm
    soil_moisture = random.uniform(20, 90)  # 20-90%
    tilt_value = random.uniform(0, 45)  # 0-45 degrees
    
    data = {
        "rain_value": round(rain_value, 2),
        "soil_moisture": round(soil_moisture, 2),
        "tilt_value": round(tilt_value, 2)
    }
    
    try:
        response = requests.post(
            f"{CONVEX_URL}/sensor-data",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            print(f"✓ Sent: Rain={data['rain_value']}, Soil={data['soil_moisture']}, Tilt={data['tilt_value']}")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ Failed to send data: {e}")

def main():
    print("=" * 60)
    print("ESP32 Simulator - Landslide IoT System")
    print("=" * 60)
    print(f"Target URL: {CONVEX_URL}/sensor-data")
    print("Sending sensor data every 10 seconds...")
    print("Press Ctrl+C to stop\n")
    
    if "your-deployment" in CONVEX_URL:
        print("⚠️  WARNING: Please update CONVEX_URL in backend/.env file")
        print("   Get your URL from: npx convex dev")
        return
    
    try:
        count = 0
        while True:
            count += 1
            print(f"\n[Reading #{count}] {time.strftime('%Y-%m-%d %H:%M:%S')}")
            send_sensor_data()
            time.sleep(10)  # Send data every 10 seconds
            
    except KeyboardInterrupt:
        print("\n\nStopping simulator...")
        print(f"Total readings sent: {count}")

if __name__ == "__main__":
    main()
