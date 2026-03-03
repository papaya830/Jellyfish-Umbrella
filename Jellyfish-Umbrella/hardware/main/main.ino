/*
  Jellyfish Umbrella — ESP32 Main Sketch
  Handles:
    - WiFi connection
    - HTTP server for /led and /move endpoints
    - 8x NeoPixel LED strips
    - 2x Servo motors (tentacle movement)

  LED Pins:  25, 26, 22, 23, 21, 19, 18, 5
  Servo Pins: LEFT → 32 | RIGHT → 33
              (avoid 25/26/22/23/21/19/18/5 — used by LEDs)

  Left servo:  neutral = 65°  | curl = 245°
  Right servo: neutral = 190° | curl = 11°

  HTTP Endpoints:
    POST /led   — body: { r, g, b, brightness, pattern }
    POST /move  — body: { direction: "left"|"right"|"loop"|"stop" }
    GET  /status
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>
#include <ESP32Servo.h>

// ------------------------------------------------------------------------------------
// WIFI CREDENTIALS — update before flashing
// ------------------------------------------------------------------------------------
const char* WIFI_SSID = "YOUR_HOTSPOT_NAME";
const char* WIFI_PASS = "YOUR_HOTSPOT_PASSWORD";

// ------------------------------------------------------------------------------------
// LED PIN & CONFIG
// ------------------------------------------------------------------------------------
#define STRIP_PIN_1 25
#define STRIP_PIN_2 26
#define STRIP_PIN_3 22
#define STRIP_PIN_4 23
#define STRIP_PIN_5 21
#define STRIP_PIN_6 19
#define STRIP_PIN_7 18
#define STRIP_PIN_8 5
#define NUM_LEDS_PER_STRIP 20
#define DEFAULT_BRIGHTNESS 160

typedef struct { uint8_t r; uint8_t g; uint8_t b; } RGB_t;

#define NO_COLOUR 0
RGB_t defaultColours[] = {
  {0, 0, 0},       // NO_COLOUR
  {255, 0, 120},   // Pink
  {0, 180, 255}    // Blue
};

Adafruit_NeoPixel strip1(NUM_LEDS_PER_STRIP, STRIP_PIN_1, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip2(NUM_LEDS_PER_STRIP, STRIP_PIN_2, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip3(NUM_LEDS_PER_STRIP, STRIP_PIN_3, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip4(NUM_LEDS_PER_STRIP, STRIP_PIN_4, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip5(NUM_LEDS_PER_STRIP, STRIP_PIN_5, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip6(NUM_LEDS_PER_STRIP, STRIP_PIN_6, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip7(NUM_LEDS_PER_STRIP, STRIP_PIN_7, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip8(NUM_LEDS_PER_STRIP, STRIP_PIN_8, NEO_GRB + NEO_KHZ800);

// ------------------------------------------------------------------------------------
// SERVO PIN & CONFIG
// ------------------------------------------------------------------------------------
#define LEFT_SERVO_PIN  32
#define RIGHT_SERVO_PIN 33

#define PULSE_MIN_US 500
#define PULSE_MAX_US 2500

#define LEFT_NEUTRAL  65.0
#define LEFT_CURL     245.0
#define RIGHT_NEUTRAL 190.0
#define RIGHT_CURL    11.0

Servo leftServo;
Servo rightServo;

// ------------------------------------------------------------------------------------
// STATE
// ------------------------------------------------------------------------------------
WebServer server(80);

// LED state
RGB_t currentColor = {0, 180, 255};  // default blue
uint8_t currentBrightness = DEFAULT_BRIGHTNESS;
String  currentPattern = "solid";

// Servo/movement state
enum MoveMode { IDLE, CURLING_LEFT, CURLING_RIGHT, LOOPING };
MoveMode moveMode = IDLE;
bool loopPhaseLeft = true;
unsigned long lastSwitchMs = 0;
const unsigned long LOOP_INTERVAL_MS = 1500;

// ------------------------------------------------------------------------------------
// LED HELPERS (from cosmos's code)
// ------------------------------------------------------------------------------------
void stripsInit() {
  strip1.begin(); strip1.show();
  strip2.begin(); strip2.show();
  strip3.begin(); strip3.show();
  strip4.begin(); strip4.show();
  strip5.begin(); strip5.show();
  strip6.begin(); strip6.show();
  strip7.begin(); strip7.show();
  strip8.begin(); strip8.show();
}

void stripsUpdate() {
  strip1.show(); strip2.show(); strip3.show(); strip4.show();
  strip5.show(); strip6.show(); strip7.show(); strip8.show();
}

void strips(uint8_t stripNum, uint8_t ledNum, RGB_t colour) {
  uint32_t c1 = strip1.Color(colour.r, colour.g, colour.b);
  uint32_t c2 = strip2.Color(colour.r, colour.g, colour.b);
  uint32_t c3 = strip3.Color(colour.r, colour.g, colour.b);
  uint32_t c4 = strip4.Color(colour.r, colour.g, colour.b);
  uint32_t c5 = strip5.Color(colour.r, colour.g, colour.b);
  uint32_t c6 = strip6.Color(colour.r, colour.g, colour.b);
  uint32_t c7 = strip7.Color(colour.r, colour.g, colour.b);
  uint32_t c8 = strip8.Color(colour.r, colour.g, colour.b);
  switch (stripNum) {
    case 0:
      strip1.setPixelColor(ledNum, c1); strip2.setPixelColor(ledNum, c2);
      strip3.setPixelColor(ledNum, c3); strip4.setPixelColor(ledNum, c4);
      strip5.setPixelColor(ledNum, c5); strip6.setPixelColor(ledNum, c6);
      strip7.setPixelColor(ledNum, c7); strip8.setPixelColor(ledNum, c8);
      break;
    case 1: strip1.setPixelColor(ledNum, c1); break;
    case 2: strip2.setPixelColor(ledNum, c2); break;
    case 3: strip3.setPixelColor(ledNum, c3); break;
    case 4: strip4.setPixelColor(ledNum, c4); break;
    case 5: strip5.setPixelColor(ledNum, c5); break;
    case 6: strip6.setPixelColor(ledNum, c6); break;
    case 7: strip7.setPixelColor(ledNum, c7); break;
    case 8: strip8.setPixelColor(ledNum, c8); break;
  }
}

RGB_t brightnessAdjust(RGB_t colour, uint32_t brightVal) {
  colour.r = colour.r * brightVal / 255;
  colour.g = colour.g * brightVal / 255;
  colour.b = colour.b * brightVal / 255;
  return colour;
}

// Set all LEDs to a solid colour
void setSolid(RGB_t colour, uint8_t brightness) {
  RGB_t c = brightnessAdjust(colour, brightness);
  for (int i = 0; i < NUM_LEDS_PER_STRIP; i++) {
    strips(0, i, c);
  }
  stripsUpdate();
}

// Non-blocking pulse — called from loop()
void updatePulse() {
  static int  pulseIdx = 0;
  static unsigned long lastPulseMs = 0;
  const unsigned long PULSE_DELAY = 10;

  if (millis() - lastPulseMs < PULSE_DELAY) return;
  lastPulseMs = millis();

  RGB_t c = brightnessAdjust(currentColor, currentBrightness);
  strips(0, pulseIdx, c);
  if (pulseIdx > 0) strips(0, pulseIdx - 1, defaultColours[NO_COLOUR]);
  stripsUpdate();

  pulseIdx++;
  if (pulseIdx >= NUM_LEDS_PER_STRIP) pulseIdx = 0;
}

// ------------------------------------------------------------------------------------
// SERVO HELPERS
// ------------------------------------------------------------------------------------
int degToUs(float deg) {
  if (deg < 0.0)   deg = 0.0;
  if (deg > 270.0) deg = 270.0;
  float t = deg / 270.0;
  return (int)(PULSE_MIN_US + t * (PULSE_MAX_US - PULSE_MIN_US) + 0.5f);
}

void setLeft(float deg)  { leftServo.writeMicroseconds(degToUs(deg));  }
void setRight(float deg) { rightServo.writeMicroseconds(degToUs(deg)); }

void goNeutral()    { setLeft(LEFT_NEUTRAL);  setRight(RIGHT_NEUTRAL); }
void goCurlLeft()   { setLeft(LEFT_CURL);     setRight(RIGHT_NEUTRAL); }
void goCurlRight()  { setLeft(LEFT_NEUTRAL);  setRight(RIGHT_CURL);    }

// ------------------------------------------------------------------------------------
// HTTP HANDLERS
// ------------------------------------------------------------------------------------
void handleLED() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no body\"}");
    return;
  }
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"error\":\"invalid JSON\"}");
    return;
  }

  currentColor.r   = doc["r"]          | currentColor.r;
  currentColor.g   = doc["g"]          | currentColor.g;
  currentColor.b   = doc["b"]          | currentColor.b;
  currentBrightness = doc["brightness"] | currentBrightness;
  currentPattern   = doc["pattern"]    | currentPattern;

  Serial.printf("[LED] r=%d g=%d b=%d bri=%d pat=%s\n",
    currentColor.r, currentColor.g, currentColor.b,
    currentBrightness, currentPattern.c_str());

  // Apply immediately for solid; other patterns update in loop()
  if (currentPattern == "solid") {
    setSolid(currentColor, currentBrightness);
  }

  server.send(200, "application/json", "{\"ok\":true}");
}

void handleMove() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no body\"}");
    return;
  }
  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"error\":\"invalid JSON\"}");
    return;
  }

  String dir = doc["direction"] | "stop";
  Serial.printf("[MOVE] direction=%s\n", dir.c_str());

  if (dir == "left") {
    moveMode = CURLING_LEFT;
    goCurlLeft();
  } else if (dir == "right") {
    moveMode = CURLING_RIGHT;
    goCurlRight();
  } else if (dir == "loop") {
    moveMode = LOOPING;
    loopPhaseLeft = true;
    lastSwitchMs = millis();
    goCurlLeft();
  } else {
    moveMode = IDLE;
    goNeutral();
  }

  server.send(200, "application/json", "{\"ok\":true}");
}

void handleStatus() {
  StaticJsonDocument<256> doc;
  doc["r"]          = currentColor.r;
  doc["g"]          = currentColor.g;
  doc["b"]          = currentColor.b;
  doc["brightness"] = currentBrightness;
  doc["pattern"]    = currentPattern;
  doc["movement"]   = (moveMode == CURLING_LEFT)  ? "left"  :
                      (moveMode == CURLING_RIGHT) ? "right" :
                      (moveMode == LOOPING)       ? "loop"  : "stop";
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// ------------------------------------------------------------------------------------
// SETUP
// ------------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  // LEDs
  stripsInit();
  setSolid(currentColor, currentBrightness);

  // Servos
  leftServo.attach(LEFT_SERVO_PIN,   PULSE_MIN_US, PULSE_MAX_US);
  rightServo.attach(RIGHT_SERVO_PIN, PULSE_MIN_US, PULSE_MAX_US);
  goNeutral();

  // WiFi
  Serial.printf("Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());   // <-- copy this into your .env as ESP32_IP

  // HTTP routes
  server.on("/led",    HTTP_POST, handleLED);
  server.on("/move",   HTTP_POST, handleMove);
  server.on("/status", HTTP_GET,  handleStatus);
  server.begin();
  Serial.println("HTTP server started");
}

// ------------------------------------------------------------------------------------
// LOOP
// ------------------------------------------------------------------------------------
void loop() {
  server.handleClient();

  // Non-blocking pattern updates
  if (currentPattern == "pulse") {
    updatePulse();
  }

  // Non-blocking servo loop
  if (moveMode == LOOPING) {
    if (millis() - lastSwitchMs >= LOOP_INTERVAL_MS) {
      lastSwitchMs = millis();
      loopPhaseLeft = !loopPhaseLeft;
      loopPhaseLeft ? goCurlLeft() : goCurlRight();
    }
  }
}
