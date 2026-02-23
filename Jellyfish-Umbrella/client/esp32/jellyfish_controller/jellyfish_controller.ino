// // code to control the jellyfish LED patterns

// /*
//  * Jellyfish Umbrella — ESP32 Controller
//  * 
//  * Receives HTTP commands from the Express server and controls:
//  *   - 8x WS2812B LED strips (14 LEDs each, all same color)
//  *   - Servo motor (bilateral tentacle curl)
//  * 
//  * HARDWARE:
//  *   Strip 1: GPIO 25    Strip 5: GPIO 21
//  *   Strip 2: GPIO 26    Strip 6: GPIO 19
//  *   Strip 3: GPIO 22    Strip 7: GPIO 18
//  *   Strip 4: GPIO 23    Strip 8: GPIO 5
//  *   Servo:   GPIO 13
//  * 
//  * ENDPOINTS:
//  *   POST /led   { "r": 0-255, "g": 0-255, "b": 0-255 }
//  *   POST /move  { "direction": "left" | "right" | "neutral" }
//  * 
//  * LIBRARIES (install via Arduino Library Manager):
//  *   - Adafruit NeoPixel
//  *   - ArduinoJson
//  *   - ESP32Servo
//  */

// #include <WiFi.h>
// #include <WebServer.h>
// #include <ArduinoJson.h>
// #include <Adafruit_NeoPixel.h>
// #include <ESP32Servo.h>

// // ─── WIFI CONFIG ───
// const char* WIFI_SSID     = "YOUR_WIFI_SSID";
// const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// // ─── LED CONFIG ───
// #define STRIP_PIN_1 25
// #define STRIP_PIN_2 26
// #define STRIP_PIN_3 22
// #define STRIP_PIN_4 23
// #define STRIP_PIN_5 21
// #define STRIP_PIN_6 19
// #define STRIP_PIN_7 18
// #define STRIP_PIN_8 5

// #define NUM_LEDS_PER_STRIP 14
// #define NUM_STRIPS 8
// #define BRIGHTNESS 64

// Adafruit_NeoPixel strips[NUM_STRIPS] = {
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_1, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_2, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_3, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_4, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_5, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_6, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_7, NEO_GRB + NEO_KHZ800),
//   Adafruit_NeoPixel(NUM_LEDS_PER_STRIP, STRIP_PIN_8, NEO_GRB + NEO_KHZ800),
// };

// // ─── SERVO CONFIG ───
// // NOTE: GPIO 18 is used by strip 7, so servo is on GPIO 13
// #define SERVO_PIN    13
// #define SERVO_LEFT   30
// #define SERVO_CENTER 90
// #define SERVO_RIGHT  150

// Servo tentacleServo;

// // ─── HTTP SERVER ───
// WebServer server(80);

// // ─── CURRENT STATE ───
// uint8_t currentR = 0;
// uint8_t currentG = 0;
// uint8_t currentB = 0;
// String  currentPosition = "neutral";

// // ═══════════════════════════════════════════
// // SETUP
// // ═══════════════════════════════════════════

// void setup() {
//   Serial.begin(115200);
//   Serial.println("\n Jellyfish Umbrella — ESP32 Starting...");

//   // ── Initialize all 8 LED strips ──
//   for (int i = 0; i < NUM_STRIPS; i++) {
//     strips[i].begin();
//     strips[i].setBrightness(BRIGHTNESS);
//     strips[i].clear();
//     strips[i].show();
//   }
//   Serial.printf("[LED] %d strips initialized — %d LEDs each (%d total)\n",
//                 NUM_STRIPS, NUM_LEDS_PER_STRIP, NUM_STRIPS * NUM_LEDS_PER_STRIP);

//   // ── Initialize Servo ──
//   tentacleServo.attach(SERVO_PIN);
//   tentacleServo.write(SERVO_CENTER);
//   Serial.printf("[Servo] Attached on GPIO %d — centered\n", SERVO_PIN);

//   // ── Connect to WiFi ──
//   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
//   Serial.print("[WiFi] Connecting");

//   int attempts = 0;
//   while (WiFi.status() != WL_CONNECTED && attempts < 30) {
//     delay(500);
//     Serial.print(".");
//     attempts++;
//   }

//   if (WiFi.status() == WL_CONNECTED) {
//     Serial.println("\n[WiFi] Connected!");
//     Serial.print("[WiFi] IP Address: ");
//     Serial.println(WiFi.localIP());
//     Serial.println("       ^ Put this in your server/.env as ESP32_IP");
//   } else {
//     Serial.println("\n[WiFi] FAILED to connect. Check credentials.");
//   }

//   // ── Startup animation ──
//   startupAnimation();

//   // ── Setup HTTP routes ──
//   server.on("/led", HTTP_POST, handleLED);
//   server.on("/move", HTTP_POST, handleMove);
//   server.on("/", HTTP_GET, handleRoot);

//   server.begin();
//   Serial.println("[HTTP] Server started on port 80");
//   Serial.println("Ready to receive commands!");
// }

// // ═══════════════════════════════════════════
// // LOOP
// // ═══════════════════════════════════════════

// void loop() {
//   server.handleClient();
// }

// // ═══════════════════════════════════════════
// // HTTP HANDLERS
// // ═══════════════════════════════════════════

// /**
//  * POST /led
//  * Body: { "r": 0-255, "g": 0-255, "b": 0-255 }
//  * Sets ALL 8 strips to the same color.
//  */
// void handleLED() {
//   if (!server.hasArg("plain")) {
//     server.send(400, "application/json", "{\"error\":\"No body\"}");
//     return;
//   }

//   StaticJsonDocument<128> doc;
//   DeserializationError err = deserializeJson(doc, server.arg("plain"));

//   if (err) {
//     server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
//     return;
//   }

//   currentR = constrain(doc["r"] | 0, 0, 255);
//   currentG = constrain(doc["g"] | 0, 0, 255);
//   currentB = constrain(doc["b"] | 0, 0, 255);

//   setAllStrips(currentR, currentG, currentB);

//   Serial.printf("[LED] All strips set to rgb(%d, %d, %d)\n", currentR, currentG, currentB);
//   server.send(200, "application/json", "{\"success\":true}");
// }

// /**
//  * POST /move
//  * Body: { "direction": "left" | "right" | "neutral" }
//  */
// void handleMove() {
//   if (!server.hasArg("plain")) {
//     server.send(400, "application/json", "{\"error\":\"No body\"}");
//     return;
//   }

//   StaticJsonDocument<128> doc;
//   DeserializationError err = deserializeJson(doc, server.arg("plain"));

//   if (err) {
//     server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
//     return;
//   }

//   String direction = doc["direction"] | "neutral";
//   currentPosition = direction;

//   int angle = SERVO_CENTER;
//   if (direction == "left") {
//     angle = SERVO_LEFT;
//   } else if (direction == "right") {
//     angle = SERVO_RIGHT;
//   }

//   tentacleServo.write(angle);
//   Serial.printf("[Servo] Direction: %s — angle: %d\n", direction.c_str(), angle);
//   server.send(200, "application/json", "{\"success\":true}");
// }

// /**
//  * GET /
//  * Health check.
//  */
// void handleRoot() {
//   StaticJsonDocument<256> doc;
//   doc["status"] = "Jellyfish ESP32 running";
//   doc["ip"] = WiFi.localIP().toString();
//   doc["strips"] = NUM_STRIPS;
//   doc["leds_per_strip"] = NUM_LEDS_PER_STRIP;
//   doc["total_leds"] = NUM_STRIPS * NUM_LEDS_PER_STRIP;

//   JsonObject color = doc.createNestedObject("color");
//   color["r"] = currentR;
//   color["g"] = currentG;
//   color["b"] = currentB;

//   doc["position"] = currentPosition;

//   String output;
//   serializeJson(doc, output);
//   server.send(200, "application/json", output);
// }

// // ═══════════════════════════════════════════
// // LED HELPERS
// // ═══════════════════════════════════════════

// /**
//  * Set every LED on all 8 strips to the same color.
//  */
// void setAllStrips(uint8_t r, uint8_t g, uint8_t b) {
//   for (int s = 0; s < NUM_STRIPS; s++) {
//     for (int i = 0; i < NUM_LEDS_PER_STRIP; i++) {
//       strips[s].setPixelColor(i, strips[s].Color(r, g, b));
//     }
//     strips[s].show();
//   }
// }

// /**
//  * Startup animation — purple sweep across all strips to confirm wiring.
//  */
// void startupAnimation() {
//   for (int i = 0; i < NUM_LEDS_PER_STRIP; i++) {
//     for (int s = 0; s < NUM_STRIPS; s++) {
//       strips[s].setPixelColor(i, strips[s].Color(160, 60, 210));
//     }
//     for (int s = 0; s < NUM_STRIPS; s++) {
//       strips[s].show();
//     }
//     delay(30);
//   }

//   delay(400);

//   // Fade out
//   for (int b = BRIGHTNESS; b >= 0; b -= 4) {
//     for (int s = 0; s < NUM_STRIPS; s++) {
//       strips[s].setBrightness(b);
//       strips[s].show();
//     }
//     delay(10);
//   }

//   // Reset
//   for (int s = 0; s < NUM_STRIPS; s++) {
//     strips[s].clear();
//     strips[s].setBrightness(BRIGHTNESS);
//     strips[s].show();
//   }
// }
