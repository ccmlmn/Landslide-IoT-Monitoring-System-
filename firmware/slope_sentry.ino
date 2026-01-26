/*
  Slope Sentry - ESP32 Firmware Skeleton
  --------------------------------------
  Hardware:
  - ESP32 Development Board
  - Rain Sensor (Analog)
  - Capacitive Soil Moisture Sensor (Analog)
  - MPU6050 Accelerometer/Gyroscope (I2C)

  Functionality:
  - Connects to WiFi
  - Reads sensor values
  - Packages data as JSON
  - Sends HTTP POST request to Flask Backend
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h> // Make sure to install ArduinoJson library

// --- CONFIGURATION ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API Endpoint (Replace IP with your PC's IP address)
// Run `ipconfig` (Windows) or `ifconfig` (Linux/Mac) to find your local IP.
const char* SERVER_URL = "http://192.168.1.100:5000/api/sensor-data"; 

// Pin Definitions
const int PIN_RAIN = 34;          // Analog pin for Rain Sensor
const int PIN_SOIL_MOISTURE = 35; // Analog pin for Soil Moisture

// MPU6050 Object
Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);

  // 1. Initialize Sensors
  pinMode(PIN_RAIN, INPUT);
  pinMode(PIN_SOIL_MOISTURE, INPUT);
  
  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    /* In production, we might want to halt or retry. 
       For PoC, we continue to allow other sensors to work. */
  } else {
    Serial.println("MPU6050 Found!");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // 2. Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConnected to network");
  Serial.println(WiFi.localIP());
}

void loop() {
  // --- READ DATA ---
  
  // 1. Rain Sensor (Values usually 0-4095, Lower is wetter for resistive sensors)
  // We invert this for logic: 0 = Dry, 100% = Wettest
  int rainRaw = analogRead(PIN_RAIN);
  // Map 4095(Dry) -> 0(Wet) to 0-100 logic roughly for visualization
  float rainValue = map(rainRaw, 4095, 0, 0, 100); 
  if (rainValue < 0) rainValue = 0; 
  
  // 2. Soil Moisture
  int soilRaw = analogRead(PIN_SOIL_MOISTURE);
  float soilValue = map(soilRaw, 4095, 0, 0, 100); // Calibration needed in field
  if (soilValue < 0) soilValue = 0;

  // 3. Tilt / Movement (MPU6050)
  sensors_event_t a, g, temp;
  float tiltValue = 0.0;
  
  if (mpu.getEvent(&a, &g, &temp)) {
    // Simple Tilt Calculation: Magnitude of acceleration on X/Y axes
    // If the sensor is flat, X and Y should be near 0.
    tiltValue = sqrt(pow(a.acceleration.x, 2) + pow(a.acceleration.y, 2));
  }

  // --- SEND DATA ---
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Create JSON Payload
    // capacity calculated using: https://arduinojson.org/v6/assistant/
    StaticJsonDocument<200> doc;
    doc["rain_value"] = rainValue;
    doc["soil_moisture"] = soilValue;
    doc["tilt_value"] = tiltValue;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.print("Sending: ");
    Serial.println(requestBody);

    // Send POST
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response: ");
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  // Send every 5 seconds
  delay(5000);
}
