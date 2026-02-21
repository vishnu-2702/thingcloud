# ESP8266 IoT Platform Client

**Ultra-simple ESP8266 client** for the IoT Device Management Platform. Just 80 lines of code with everything you need!

## 🚀 Quick Setup (2 Minutes)

### 1. Edit Configuration
Open `iot_platform_client.ino` and change these 4 lines:
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // Your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Your WiFi password
const char* SERVER_IP = "192.168.1.100";         // Your server IP
const char* API_KEY = "YOUR_DEVICE_API_KEY";     // From platform
```

### 2. Get API Key
1. Open IoT platform dashboard (http://localhost:3000)
2. Go to **Devices** → **Add Device**
3. Create device and copy the API key
4. Paste API key in your code

### 3. Upload and Monitor
- Upload to ESP8266
- Open Serial Monitor (115200 baud)
- Watch real-time telemetry transmission

## 📊 What It Sends

The device simulates 3 sensors and sends data every 30 seconds:

```json
{
  "data": {
    "1": 24.3,    // Temperature (°C)
    "2": 62.1,    // Humidity (%)
    "3": 75       // Light level (%)
  }
}
```

**Virtual Pin Mapping**:
- Pin 1: Temperature (18-28°C range)
- Pin 2: Humidity (40-80% range)
- Pin 3: Light Level (20-90% range)

## � Features

✅ **Minimal Code**: Only 80 lines, easy to understand  
✅ **No External Libraries**: Uses only built-in ESP8266 libraries  
✅ **Auto WiFi Reconnect**: Handles network drops automatically  
✅ **LED Status**: Built-in LED shows connection status  
✅ **Realistic Simulation**: Gradual sensor value changes  
✅ **Memory Efficient**: Works on any ESP8266 variant  

## 🔌 Compatible Hardware

Works on **any ESP8266 board**:
- ESP-01, ESP-12E, NodeMCU, Wemos D1 Mini
- Only needs WiFi connection and built-in LED
- No external sensors required

## 📡 Serial Monitor Output

```
=== IoT Platform Client ===
Connecting to WiFi....... Connected!
IP: 192.168.1.155
Ready to send data
Sending: T=23.2 H=58.7 L=67 ✓
Sending: T=23.5 H=59.1 L=65 ✓
```

## � LED Status

- **ON**: Connecting to WiFi
- **OFF**: Connected and running
- **Quick Flash**: Data sent successfully

## � Troubleshooting

**WiFi won't connect:**
- Check SSID/password spelling
- Ensure 2.4GHz network (not 5GHz)
- Move closer to router

**HTTP errors:**
- Verify server IP address
- Check backend server is running
- Confirm API key is correct

## 🎯 Perfect For

- IoT beginners
- Platform testing  
- Rapid prototyping
- Educational demos

---

**That's it!** 80 lines of code for a complete IoT device client. 🚀
