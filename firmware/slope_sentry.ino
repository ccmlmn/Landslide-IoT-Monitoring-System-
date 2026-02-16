/*
  Slope Sentry - ESP32 Firmware (Final Version)
  --------------------------------------
  Hardware:
  - ESP32 Development Board (DOIT DevKit V1)
  - Rain Sensor (Analog Pin 34 + Digital Pin 14)
  - Capacitive Soil Moisture Sensor (Analog Pin 32)
  - MPU6050 Accelerometer/Gyroscope (I2C Pins 21, 22)
  - 3x LEDs (Pins 17, 5, 18)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h> // Ensure you have installed "ArduinoJson" by Benoit Blanchon

// --- CONFIGURATION ---
const char *WIFI_SSID = "your wifi name";                                         // <--- ENTER WIFI NAME
const char *WIFI_PASSWORD = "your wifi password";                                 // <--- ENTER WIFI PASSWORD
const char *SERVER_URL = "https://your-development-site.convex.site/sensor-data"; // <--- ENTER CONVEX URL

// --- PIN DEFINITIONS ---
const int PIN_RAIN_ANALOG = 34;  // Analog data (0-100%)
const int PIN_RAIN_DIGITAL = 14; // Digital Trigger (Wet/Dry)
const int PIN_SOIL = 32;         // Analog data
const int PIN_LED_RAIN = 17;     // Alert LED
const int PIN_LED_SOIL = 5;      // Alert LED
const int PIN_LED_TILT = 18;
const int PIN_BUZZER = 19; // Alert LED

// --- THRESHOLDS ---
const int THRESHOLD_SOIL = 2000;   // Trigger LED if value is below this
const float THRESHOLD_TILT = 20.0; // Trigger LED if angle > 20 degrees

// MPU6050 Object
Adafruit_MPU6050 mpu;

void setup()
{
  Serial.begin(115200);
  while (!Serial)
    delay(10); // Wait for Serial Monitor

  // 1. Initialize LED Pins
  pinMode(PIN_LED_RAIN, OUTPUT);
  pinMode(PIN_LED_SOIL, OUTPUT);
  pinMode(PIN_LED_TILT, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // 2. Initialize Sensor Pins
  pinMode(PIN_RAIN_DIGITAL, INPUT);
  // Analog pins (34, 32) are input by default, but good practice to declare logic if needed

  // 3. Initialize MPU6050 (With Address Check)
  Serial.println("Initializing MPU6050...");
  Wire.begin(21, 22); // Force SDA, SCL

  if (!mpu.begin(0x68))
  {
    Serial.println("Address 0x68 failed. Trying 0x69...");
    if (!mpu.begin(0x69))
    {
      Serial.println("CRITICAL: MPU6050 not found!");
      // We continue so the other sensors still work
    }
  }

  if (mpu.getAccelerometerRange() != MPU6050_RANGE_8_G)
  {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 Configured.");
  }

  // 4. Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop()
{
  // --- READ DATA ---

  // 1. Rain Sensor
  int rainRaw = analogRead(PIN_RAIN_ANALOG);
  int rainDigital = digitalRead(PIN_RAIN_DIGITAL); // Read 0 (Wet) or 1 (Dry)

  // Map 4095(Dry) -> 0(Wet) to 0-100%
  float rainValue = map(rainRaw, 4095, 0, 0, 100);
  if (rainValue < 0)
    rainValue = 0;

  // 2. Soil Moisture
  int soilRaw = analogRead(PIN_SOIL);
  float soilValue = map(soilRaw, 2000, 2600, 100, 0);
  soilValue = constrain(soilValue, 0, 100);
  if (soilValue < 0)
    soilValue = 0;

  // 3. Tilt (MPU6050)
  sensors_event_t a, g, temp;
  float tiltValue = 0.0;

  // Only try to read if MPU is connected
  if (mpu.getAccelerometerRange() != 0)
  {
    mpu.getEvent(&a, &g, &temp);
    // Calculate Tilt Angle (Y/Z axis method)
    tiltValue = abs(atan2(a.acceleration.y, a.acceleration.z) * 180 / PI);
  }

  // --- LED ALERT LOGIC ---

  // Rain LED (Use Digital Pin for fast response)
  if (rainDigital == LOW)
  {
    digitalWrite(PIN_LED_RAIN, HIGH);
  }
  else
  {
    digitalWrite(PIN_LED_RAIN, LOW);
  }

  // Soil LED (Threshold check)
  if (soilRaw < THRESHOLD_SOIL)
  {
    digitalWrite(PIN_LED_SOIL, HIGH);
  }
  else
  {
    digitalWrite(PIN_LED_SOIL, LOW);
  }

  // Tilt LED (Angle check)
  if (tiltValue > THRESHOLD_TILT)
  {
    digitalWrite(PIN_LED_TILT, HIGH);
  }
  else
  {
    digitalWrite(PIN_LED_TILT, LOW);
  }

  // --- SEND DATA ---

  if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Create JSON Payload
    // keys match your Convex Database Screenshot
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

    if (httpResponseCode > 0)
    {
      String response = http.getString();
      Serial.print("Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response: ");
      Serial.println(response);

      // Parse JSON response: expects {"riskState":"low|moderate|high"}
      StaticJsonDocument<256> respDoc;
      DeserializationError err = deserializeJson(respDoc, response);

      if (!err)
      {
        const char *riskState = respDoc["riskState"];
        if (riskState && strcmp(riskState, "High") == 0)
        {
          digitalWrite(PIN_BUZZER, HIGH);
        }
        else
        {
          digitalWrite(PIN_BUZZER, LOW);
        }
      }
      else
      {
        digitalWrite(PIN_BUZZER, LOW); // fail-safe
      }
    }
    else
    {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
      digitalWrite(PIN_BUZZER, LOW); // fail-safe
    }
    http.end();
  }
  else
  {
    Serial.println("WiFi Disconnected");
  }

  // Send every 10 seconds
  delay(10000);
}