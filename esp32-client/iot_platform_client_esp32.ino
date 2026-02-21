/*
  IoT Platform Client - ESP32 Version
  
  Optimized for ESP32 with better HTTPS support and memory management
  
  QUICK SETUP:
  1. Edit WiFi and server settings below
  2. Register device in platform and get API key
  3. Upload to ESP32 and monitor via Serial (115200 baud)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ========================================
// CONFIGURATION - Edit these values only
// ========================================
const char* WIFI_SSID = "VISHNU";
const char* WIFI_PASSWORD = "12345678";
const char* SERVER_URL = "https://iot-platform-backend.vercel.app"; // Your server URL
const char* API_KEY = "38aacfd6-7119-44f2-bda6-c7e30f474fd6";   // From device registration

// Timing
const unsigned long SEND_INTERVAL = 30000;      // Send every 30 seconds
// ========================================

unsigned long lastSend = 0;

// Temperature (Pin V0)
float temperature = 25.5;
// Humidity (Pin V1)
float humidity = 55.0;
// Light Level (Pin V2)
float lightlevel = 500.0;
// Light Switch (Pin V3)
float lightswitch = 0.0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== IoT Platform Client - ESP32 ===");

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  // Seed random number generator
  randomSeed(analogRead(34)); // Use ADC pin for better randomness

  connectWiFi();
  Serial.println("Ready to send data");
  digitalWrite(LED_BUILTIN, LOW);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (millis() - lastSend > SEND_INTERVAL) {
    updateSensors();
    sendData();
    lastSend = millis();
  }

  delay(100);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" Failed!");
    Serial.println("Retrying in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

void updateSensors() {
  // Simulate realistic sensor readings
  temperature += random(-10, 11) / 10.0;
  temperature = constrain(temperature, 0.0, 100.0);

  humidity += random(-20, 21) / 10.0;
  humidity = constrain(humidity, 0.0, 100.0);

  lightlevel += random(-50, 51);
  lightlevel = constrain(lightlevel, 0.0, 1024.0);

  // Simulate a switch toggling randomly
  if (random(0, 10) > 7) {
    lightswitch = (lightswitch == 0.0) ? 1.0 : 0.0;
  }
}

void sendData() {
  WiFiClientSecure *client = new WiFiClientSecure;
  
  if (!client) {
    Serial.println(" ✗ Unable to create secure client!");
    return;
  }

  // Skip certificate validation (use for testing only)
  client->setInsecure();

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/telemetry";

  // Create JSON payload
  String payload = "{\"data\":{";
  payload += "\"V0\":" + String(temperature, 1) + ",";
  payload += "\"V1\":" + String(humidity, 1) + ",";
  payload += "\"V2\":" + String(lightlevel, 1) + ",";
  payload += "\"V3\":" + String(lightswitch, 1);
  payload += "}}";

  Serial.print("Sending data to: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);

  if (http.begin(*client, url)) {
    // Set timeouts
    http.setTimeout(15000); // 15 second timeout
    
    // Add required headers
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    http.addHeader("Connection", "close");
    http.addHeader("User-Agent", "ESP32-IoT-Client/1.0");

    Serial.print("  -> T: ");
    Serial.print(temperature, 1);
    Serial.print(" | L: ");
    Serial.print(lightlevel, 1);
    Serial.print(" | ");

    int responseCode = http.POST(payload);

    if (responseCode > 0) {
      if (responseCode == 201 || responseCode == 200) {
        Serial.println("✓ Data sent successfully");
        digitalWrite(LED_BUILTIN, HIGH);
        delay(100);
        digitalWrite(LED_BUILTIN, LOW);
      } else {
        Serial.print("✗ HTTP Error ");
        Serial.print(responseCode);
        Serial.print(": ");
        String response = http.getString();
        Serial.println(response);
      }
    } else {
      Serial.print("✗ HTTP request failed: ");
      Serial.println(http.errorToString(responseCode));
      
      // Detailed error info
      switch(responseCode) {
        case HTTPC_ERROR_CONNECTION_FAILED:
          Serial.println("    -> Connection failed. Check:");
          Serial.println("       1. Server URL is correct");
          Serial.println("       2. Internet connection is stable");
          Serial.println("       3. Server is running");
          break;
        case HTTPC_ERROR_CONNECTION_LOST:
          Serial.println("    -> Connection lost during request");
          break;
        case HTTPC_ERROR_READ_TIMEOUT:
          Serial.println("    -> Server response timeout");
          break;
        case HTTPC_ERROR_NO_STREAM:
          Serial.println("    -> No data stream available");
          break;
        default:
          Serial.print("    -> Error code: ");
          Serial.println(responseCode);
      }
    }

    http.end();
  } else {
    Serial.println(" ✗ Unable to initialize HTTP connection!");
  }

  // Cleanup
  delete client;
}
