/*
 * ESP8266 IoT Platform Client - Simple Configuration
 * 
 * Minimal config for the ESP8266 client
 * Note: Main configuration is now in the .ino file for simplicity
 */

#ifndef CONFIG_H
#define CONFIG_H

// Virtual Pin Mapping (matches platform templates)
#define TEMP_PIN "1"        // Temperature sensor
#define HUMIDITY_PIN "2"    // Humidity sensor  
#define LIGHT_PIN "3"       // Light level sensor

// Hardware
#define LED_PIN LED_BUILTIN // Status LED

// Network timeouts
#define HTTP_TIMEOUT 5000   // 5 second timeout

#endif // CONFIG_H
