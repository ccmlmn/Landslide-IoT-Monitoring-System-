import os
import time
from dotenv import load_dotenv
from convex_client import ConvexClient
from anomaly_detector import AnomalyDetector

# Load environment variables
load_dotenv()

CONVEX_URL = os.getenv("CONVEX_URL")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))  # seconds

def main():
    """Main processing loop"""
    
    if not CONVEX_URL:
        print("Error: CONVEX_URL not set in environment variables")
        return
    
    print(f"Starting Landslide IoT Processing Server")
    print(f"Convex URL: {CONVEX_URL}")
    print(f"Poll Interval: {POLL_INTERVAL}s")
    print("-" * 50)
    
    # Initialize clients
    convex = ConvexClient(CONVEX_URL)
    detector = AnomalyDetector(window_size=20)
    
    processed_count = 0
    
    while True:
        try:
            # Fetch unprocessed data
            unprocessed_data = convex.get_unprocessed_data()
            
            if unprocessed_data:
                print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Found {len(unprocessed_data)} unprocessed records")
                
                for data in unprocessed_data:
                    try:
                        # Extract sensor values
                        rain = data.get("rainValue", 0.0)
                        soil = data.get("soilMoisture", 0.0)
                        tilt = data.get("tiltValue", 0.0)
                        sensor_id = data.get("_id")
                        timestamp = data.get("timestamp")
                        
                        # Calculate risk using Z-score
                        risk_score, risk_state, z_scores = detector.update_and_score(rain, soil, tilt)
                        
                        print(f"  Processing {sensor_id[:8]}... -> Risk: {risk_state} ({risk_score}%)")
                        
                        # Prepare result data
                        result_data = {
                            "sensorDataId": sensor_id,
                            "timestamp": timestamp,
                            "rainValue": float(rain),
                            "soilMoisture": float(soil),
                            "tiltValue": float(tilt),
                            "riskScore": float(risk_score),
                            "riskState": risk_state,
                            "zScoreRain": float(z_scores["rain"]),
                            "zScoreSoil": float(z_scores["soil"]),
                            "zScoreTilt": float(z_scores["tilt"]),
                        }
                        
                        # Save result to Convex
                        if convex.add_anomaly_result(result_data):
                            # Mark as processed
                            convex.mark_as_processed(sensor_id)
                            processed_count += 1
                            print(f"    ✓ Saved to database (Total processed: {processed_count})")
                        else:
                            print(f"    ✗ Failed to save result")
                            
                    except Exception as e:
                        print(f"    ✗ Error processing record: {e}")
                        continue
            else:
                # No data to process
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] No unprocessed data. Waiting...", end="\r")
            
            # Wait before next poll
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\nShutting down gracefully...")
            print(f"Total records processed: {processed_count}")
            break
        except Exception as e:
            print(f"\n✗ Error in main loop: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
