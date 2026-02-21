/*
  sample testing device - test - Generated Template Code

  Description: testing purpose
  Category: general
  Virtual Pins: 4

  QUICK SETUP:
  1. Edit WiFi and server settings below
  2. Register device in platform and get API key
  3. Upload to ESP8266 and monitor via Serial (115200 baud)
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#in
// Timing
const unsigned long SEND_INTERVAL = 30000;      // Send every 30 seconds
// ========================================

// Use WiFiClientSecure for HTTPS =o3t000;   
WiFiCli=======e client;

=3000;   
ature (=======

ty (Pin=3000;   
idity ========

htlevel = 500.0;
// light switch (Pin V3)
float lightswitch = 0.0; // Typically a switch is 0 or 1

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== sample testing device - test ===");

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // Turn LED on to indicate setup

  // Seed random number generator
  randomSeed(analogRead(A0));

  coS
  
  // Sync time for SSL certificate validation
  SeS
  Syncing time...");
  // cync time for SSL certificate validation
  SoS
  Syncing time...");
  // cync time for SSL certificate validation
  SonfigTime(0("
  Syncing time...");
  // cync time for SSL certificate validation
  SonfigTime(0("Syncing time...");
  configTime(0, 0, "poo,. tp.org", "time.nist.gov");
  time_t now = time(nullptr);
  int retries = 0;
  while 0now < 8 * 3600 * 2 && retries < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retries++;
  }
  Serial.println(" done!");
  
  // Use BearSSL to skip certificate validation (for testing)
  // For production, you should add proper certificate validation
  client.setInsecure();
  
  Serial.println(, "poo,. tp.org", "time.nist.gov");
  time_t now = time(nullptr);
  int retries = 0;
  while 0now < 8 * 3600 * 2 && retries < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retries++;
  }
  Serial.println(" done!");
  
  // Use BearSSL to skip certificate validation (for testing)
  // For production, you should add proper certificate validation
  client.setInsecure();
  
  Serial.println(, "poo,. tp.org", "time.nist.gov");
  time_t now = time(nullptr);
  int retries = 0;
  while 0now < 8 * 3600 * 2 && retries < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retries++;
  }
  Serial.println(" done!");
  
  // Use BearSSL to skip certificate validation (for testing)
  // For production, you should add proper certificate validation
  client.setInsecure();
  
  Serial.println(, "pool.ntp.
payload += "\"V0\":" + String(temperature, 1) + ",";
  payload += "\"V3\":" + String(lightswitch, 1);
  payload += "}}";

  Serial.print("Sending data to: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);
  
  // Check WiFi before attempting connection
  if (WiFi.status() != WL_CONNECTED) {
      Serial.println(" ✗ WiFi not connected!");
    reheck WnFi befoattmpting onnton
  if (WiFi.status() != WL_CONNECTED) {
      Srial.priln("✗ WFi nocnnec!");
   rurheck WFi befoattmpting onnton
  if (WiFi.status() != WL_CONNECTED) {
      Srial.priln("✗ WFi nocnnec!");
   rurheck WFi befoattmpting onnton
  if (WiFi.status() != WL_CONNECTED) {
    Srial.priln("✗ WFi nocnnec!");
   rur;
  }

  //ConigueBearSL client
  }
  //ConigueBearSL client
  }Increassson cachimpovprfmnc
  //ConigueBearSL client04  }Increassson cachimpovprfmnc
i cliIncreasn.snscuon cache); /imp/ovp perftimtnc verification
ne improvformancse
15clien20 al.20n0|nmu
  !http.begin(client, url)) {
  al.print(" | ");    Serial.println("✗ Failed to begin HTTP connection!");

  egin HTTPS connectroe
  !http.begin(client,uurl)) {
  rial.print(" | ");    Snrial.println("✗ Failed to begin HTTP connection!");

   Begin HTTPS connectroe
   (!http.begin(client,uurl)) {
  Serial.print(" | ");    Snrial.println("✗ Failed to begin HTTP connection!");

  // Begin HTTPS connectroe
  if (!http.begin(client,uurl)) {
    Snrial.println("✗ Failed to begin HTTP connection!");
    return;
  }

  // Set HTTP timeout and header;
  htt.setTimeut(20000);
  http.addHeader("Cotent-Type", "application/jon");
  http.addHader("X-API-Key", API_KEY);
  http.addHeader("nnection", "close");
  http.adHader("User-Agent","ESP8266");

  // Send POST request
  int responseCode 
  }

  // HTTP timeout and he201
setTimeut(20000);✓Success
.addHeader("Cotent-Type", "application/jon");
.addHader("X-API-Key", API_KEY);
.addHeader("nnection", "close");
tp.adHader("User-Agent","ESP8266");
 ");
     Serial.pint(esponseCde);
      Serial.pint(":);
      Serial.println(http.getString()
  //}
 S}eelsen{
d POST requestt("✗ Failed: ");
    
    swich {
      case HTTPC_ERROR_CONNECTION_FAILED:
        Serial.println("Connection failed (SSLihandshakenissue)");
t responseCode ln    Try 1) Check time sync 2) Verify WiFisignal;
        break
     }caseHTTPC_ERROR_CONNECTION_LOST:
"Connecion los");
        break;
      cas HTTPC_ERROR_READ_TIMEOUT:
        erial.pntl"Read timeout"
break;
   //HcaP tHTTPC_ERROR_NO_STREAM:meout and he201
setTimeut(20000);✓Sulnc"No streamc);
        break;
    esdefut
.addHeader("Cotent-Type", "application/jon");
.addHader("X-API-Key", A);
.addHeader("nnection", "close");
tp.adHader("User-Agent","E);
    }
  }

  http.end();
  client.stop(SP
  
  // Small delay to let connection fully close8266");
  delay(10);
}");
     Serial.pint(esponseCde);
      Serial.pint(":);
      Serial.println(http.getString()
  //}
 S}eelsen{
d POST requestt("✗ Failed: ");
    
    swich {
      case HTTPC_ERROR_CONNECTION_FAILED:
        Serial.println("Connection failed (SSLihandshakenissue)");
t responseCode ln    Try 1) Check time sync 2) Verify WiFisignal;
        break
     }caseHTTPC_ERROR_CONNECTION_LOST:
"Connecion los");
        break;
      cas HTTPC_ERROR_READ_TIMEOUT:
        erial.pntl"Read timeout"
break;
   //HcaP tHTTPC_ERROR_NO_STREAM:meout and he201
.setTimeout(20000);✓lnS"No streamu);
        break;
    cedefsut
.addHeader("Content-Type", "application/json");
.addHeader("X-API-Key", Y);
.addHeader("Connection", "close");
tp.addHeader("User-Agent",);
    }
  }

  http.end();
  client.stop( "
  
  // Small delay to let connection fully closeESP8266");
  delay(10);
}");
     Serial.pint(esponseCde);
      Serial.pint(":);
      Serial.println(http.getString()
  //}
 S}eelsen{
d POST requestt("✗ Failed: ");
    
    swich {
      case HTTPC_ERROR_CONNECTION_FAILED:
        Serial.println("Connection failed (SSLihandshakenissue)");
t responseCode = httlnp.    TryP 1) Check time sync 2) Verify WiFiOsignalST;
        break(payload);
   caseHTTPC_ERROR_CONNECTION_LOST:
"Connecion los");
        break;
      cas HTTPC_ERROR_READ_TIMEOUT:
        erial.pntl"Read timeout"
  if (rebreak;ponseCode > 0) {
     fcaresHTTPC_ERROR_NO_STREAM:onseCode == 201 || responseCode == 200) {
      Serial.printlnln("No stream");
        break;
    ✓Sdefcuet"
      digitalWrite(LED_BUILTIN, HIGH);
      delay(100);
      digitalWrite(LED_BUILTIN, LOW);
    } else {);
    }
  }

  http.end();
  client.stop(
  
  // Small delay to let connection fully close
  delay(10);
}     Serial.print("✗ HTTP ");
      Serial.print(responseCode);
      Serial.print(": ");
      Serial.println(http.getString());
    }
  } else {
    Serial.print("✗ Failed: ");
    
    switch(responseCode) {
      case HTTPC_ERROR_CONNECTION_FAILED:
        Serial.println("Connection failed (SSL handshake issue)");
        Serial.println("    Try: 1) Check time sync 2) Verify WiFi signal");
        break;
      case HTTPC_ERROR_CONNECTION_LOST:
        Serial.println("Connection lost");
        break;
      case HTTPC_ERROR_READ_TIMEOUT:
        Serial.println("Read timeout");
        break;
      case HTTPC_ERROR_NO_STREAM:
        Serial.println("No stream");
        break;
      default:
        Serial.print(http.errorToString(responseCode));
        Serial.print(" (");
        Serial.print(responseCode);
        Serial.println(")");
    }
  }

  http.end();
  client.stop();
  
  // Small delay to let connection fully close
  delay(10);
}       
        // Print more debug info
        if (responseCode == HTTPC_ERROR_CONNECTION_FAILED) {
          Serial.println("    Connection failed - check server URL and SSL");
        } else if (responseCode == HTTPC_ERROR_CONNECTION_LOST) {
          Serial.println("    Connection lost - check network stability");
        } else if (responseCode == HTTPC_ERROR_READ_TIMEOUT) {
          Serial.println("    Read timeout - server may be slow");
        }
    }

    http.end();
  } else {
    Serial.println(" ✗ Unable to initialize HTTP connection!");
  }
  
  // Force cleanup
  client.stop();
}
