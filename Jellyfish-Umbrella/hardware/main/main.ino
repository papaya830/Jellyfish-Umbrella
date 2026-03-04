#include <stdlib.h>
#include <stdint.h>
#include <Adafruit_NeoPixel.h>
// strip.setPixelColor(i, color);
// i: LED number
// color: strip.Colour(R, G, B)
// 24 bits is sent, 8 bits per colour, converts 0-255 to bits

// ------------------------------------------------------------------------------------
// PIN & VALUE DEFINITIONS
// ------------------------------------------------------------------------------------
// ESP32 pins connected to DATA IN
#define STRIP_PIN_1 25
#define STRIP_PIN_2 26
#define STRIP_PIN_3 22
#define STRIP_PIN_4 23
#define STRIP_PIN_5 21
#define STRIP_PIN_6 19
#define STRIP_PIN_7 18
#define STRIP_PIN_8 5
// Number of LEDs per strip
#define NUM_LEDS_PER_STRIP 20
// Default brightness, 1 - 255 range
#define BRIGHTNESS 160

// RGB struct for holding each colours RGB values
typedef struct {
  uint8_t r;
  uint8_t g;
  uint8_t b;
} RGB_t;

// Index definitions for below RBG_t array which contains hardcoded colours
#define NO_COLOUR 0
#define PINK_IDX 1
#define BLUE_IDX 2
RGB_t defaultColours[] = {
  {0, 0, 0},
  {255, 0, 120}, // Pink
  {0, 180, 255} // Blue
};

// Global interrupt flag to exit twinkle loop if website instructions
volatile bool stopTwinkle = false;

// Variable for picking all strips
#define ALL_STRIPS 0

// LED stips object intialization
Adafruit_NeoPixel strip1(NUM_LEDS_PER_STRIP, STRIP_PIN_1, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip2(NUM_LEDS_PER_STRIP, STRIP_PIN_2, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip3(NUM_LEDS_PER_STRIP, STRIP_PIN_3, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip4(NUM_LEDS_PER_STRIP, STRIP_PIN_4, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip5(NUM_LEDS_PER_STRIP, STRIP_PIN_5, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip6(NUM_LEDS_PER_STRIP, STRIP_PIN_6, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip7(NUM_LEDS_PER_STRIP, STRIP_PIN_7, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip8(NUM_LEDS_PER_STRIP, STRIP_PIN_8, NEO_GRB + NEO_KHZ800);

// ------------------------------------------------------------------------------------
// SETUP & CONTROL LOOP
// ------------------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);
  stripsInit();
}

void loop() {
  pulse(ALL_STRIPS, defaultColours[PINK_IDX], BRIGHTNESS, 10);
  Serial.println("Cycle done");
  delay(500);
}

// ------------------------------------------------------------------------------------
// FUNCTION DEFINITIONS
// ------------------------------------------------------------------------------------
void stripsInit() {
  strip1.begin();
  strip1.show();
  strip2.begin();
  strip2.show();
  strip3.begin();
  strip3.show();
  strip4.begin();
  strip4.show();
  strip5.begin();
  strip5.show();
  strip6.begin();
  strip6.show();
  strip7.begin();
  strip7.show();
  strip8.begin();
  strip8.show();
}

// Parameters: What strip to apply colour to, what LED on strip to apply colour
// what RGB_t colour to put on strip
void strips(uint8_t stripNum, uint8_t ledNum, RGB_t colour) {
  uint32_t colorConvert1 = strip1.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert2 = strip2.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert3 = strip3.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert4 = strip4.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert5 = strip5.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert6 = strip6.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert7 = strip7.Color(colour.r, colour.g, colour.b);
  uint32_t colorConvert8 = strip8.Color(colour.r, colour.g, colour.b);
  switch (stripNum) {
    case 0:
      // All LEDs
      strip1.setPixelColor(ledNum, colorConvert1);
      strip2.setPixelColor(ledNum, colorConvert2);
      strip3.setPixelColor(ledNum, colorConvert3);
      strip4.setPixelColor(ledNum, colorConvert4);
      strip5.setPixelColor(ledNum, colorConvert5);
      strip6.setPixelColor(ledNum, colorConvert6);
      strip7.setPixelColor(ledNum, colorConvert7);
      strip8.setPixelColor(ledNum, colorConvert8);
    case 1:
      strip1.setPixelColor(ledNum, colorConvert1);
    break;

    case 2:
      strip2.setPixelColor(ledNum, colorConvert2);
    break;

    case 3:
      strip3.setPixelColor(ledNum, colorConvert3);
    break;

    case 4:
      strip4.setPixelColor(ledNum, colorConvert4);
    break;

    case 5:
      strip5.setPixelColor(ledNum, colorConvert5);
    break;

    case 6:
      strip6.setPixelColor(ledNum, colorConvert6);
    break;

    case 7:
      strip7.setPixelColor(ledNum, colorConvert7);
    break;

    case 8:
      strip8.setPixelColor(ledNum, colorConvert8);
    break;
  }
}

// Updates all strips after you send command
void stripsUpdate() {
  strip1.show();
  strip2.show();
  strip3.show();
  strip4.show();
  strip5.show();
  strip6.show();
  strip7.show();
  strip8.show();
}

// Takes colour and a brightness value from 1-255 and outputs scaled colour brightness
RGB_t brightnessAdjust(RGB_t colour, uint32_t brightVal) {
  colour.r = colour.r * brightVal / 255;
  colour.g = colour.g * brightVal / 255;
  colour.b = colour.b * brightVal / 255;
  return colour;
}

void twinkle(uint32_t stripNum, RGB_t colour, uint8_t brightness, uint32_t cycles, uint32_t milliDelay) {
  // Outer for picking LEDs
  uint32_t iterIdx = 0;

  uint8_t ranLedNumArr[3];
  uint8_t ranLedNumArrSize = 3;
  uint8_t ranLedNumArrIdx = 0;
  // Twinkles 'cycles' of times, keeps going indefinitely if 'cycles' is set 0 until
  // global flag is raised
  while (!stopTwinkle && (!cycles || cycles > iterIdx)) {
    // Generate random LED number(s)
    for (int i = 0; i < ranLedNumArrSize; i++) {
      bool isBad = true;
      // Loop until good
      while (isBad) {
        // Generate random number from 1 to NUM_LEDS_PER_STRIP
        ledRanStartsArr[i] = esp_random() % NUM_LEDS_PER_STRIP + 1;
        // Checks if LED num is num we want
        for (int j = 0; j < ranLedNumArrSize; j++) {
          if ((ranLedNumArr[i] >= ranLedNumArr[j] - 2)
              && (ranLedNumArr[i] <= ranLedNumArr[j] + 2)) {
            isBad = true;
            break;
          } else {
            isBad = false;
          }
        }
      }
    }

    // Increase and then decrease brightness with random delays for 3 LEDs per sequence
    // Brightness value increases every 1ms
    uint8_t brightnessIncreaseRate = 1;
    // Array to store brightness vals for each LED during increase and decrease
    uint32_t ledBrightnessArr[3];
    uint8_t ledBrightnessArrSize = 3;
    // Fill array with zeros
    for (int i = 0; i < ledBrightnessArrSize; i++) {
      ledBrightnessArr[i] = 0;
    }
    // Array to store the 2nd and 3rd random LED starts
    // LED starts are in brightness
    uint32_t ledRanStartsArr[ledBrightnessArrSize - 1];
    uint8_t ledRanStartIdx = 0;
    // Get random LED start and check if values is good
    // Only random start for second and third LED
    for (int i = 0; i < ledBrightnessArrSize - 1; i++) {
        bool isBad = true;
        // Loop until good
        while (isBad) {
          // Generate random number from 1 to brightness
          ledRanStartsArr[i] = esp_random() % brightness + 1;
          // Check first random start is good
          if (i == 0 && (ledRanStartsArr[i] <= brightness/2
          || ledRanStartsArr[i] >= brightness*2)) {
            isBad = true;
            break;
          } else if (i == 0) {
            isBad = false;
          }
          // Check second random start is good
          if ((ledRanStartsArr[i] >= (ledRanStartsArr[i - 1] + brightness/2))
            && (ledRanStartsArr[ranLedNumArrIdx] <= ledRanStartsArr[i - 1] + brightness*2)) {
            isBad = true;
            break;
          } else {
            // Make second random start dependent on first
            ledRanStartsArr[i] += ledRanStartsArr[i - 1];
            isBad = false;
          }
        }
    }

    // Iterates through brightness changes in all 3 LEDs
    // * 2 in condition for increasing AND decreasing brightness periods
    for (int i = 1; i < ledRanStartsArr[1] + brightness; i += 10) {
      // Increment brightnesses
      for (int j = 0; j < ledBrightnessArrSize; j++) {
        ledBrightnessArr[j] += i;
      }

      // First LED
      // Increasing brightness
      if (ledBrightnessArr[0] <= brightness) {
        RGB_t colourBrighntnessChangeLed1 = brightnessAdjust(colour, ledBrightnessArr[0]);  
        strips(stripNum, ranLedNumArr[0], colourBrighntnessChangeLed1);
      // Decreasing brightness
      } else if (ledBrightnessArr[0] > brightness && ledBrightnessArr[0] <= brightness*2) {
        RGB_t colourBrighntnessChangeLed1 = brightnessAdjust(colour, (brightness - ledBrightnessArr[0] % brightness));  
        strips(stripNum, ranLedNumArr[0], colourBrighntnessChangeLed1);
      // Past its period
      } else (ledBrightnessArr[0] > brightness*2) {
        strips(stripNum, ranLedNumArr[0], defaultColour[NO_COLOUR]);
      }

      // Second LED
      // Increasing brightness
      if (ledBrightnessArr[0] <= brightness) {
        RGB_t colourBrighntnessChangeLed1 = brightnessAdjust(colour, ledBrightnessArr[0]);  
        strips(stripNum, ranLedNumArr[0], colourBrighntnessChangeLed1);
      // Decreasing brightness
      } else if (ledBrightnessArr[0] > brightness && ledBrightnessArr[0] <= brightness*2) {
        RGB_t colourBrighntnessChangeLed1 = brightnessAdjust(colour, (brightness - ledBrightnessArr[0] % brightness));  
        strips(stripNum, ranLedNumArr[0], colourBrighntnessChangeLed1);
      // Past its period
      } else (ledBrightnessArr[0] > brightness*2) {
        strips(stripNum, ranLedNumArr[0], defaultColour[NO_COLOUR]);
      }

      delay(brightnessIncreaseRate);
    }
  }
  // Wraps automatically if none-stop cycles
  iterIdx++;
}

// Creates pulse
// milliDelay is how fast LED travels across strip
void pulse(uint8_t stripNum, RGB_t colour, uint8_t brightness, uint32_t milliDelay) {
  // Adjust colour brightness
  RGB_t colourAdjustedBrightness = brightnessAdjust(colour, brightness);
  // Seqentially goes through each LED and turns it on and then off
  for (int i = 1; i < NUM_LEDS_PER_STRIP + 1; i++) {
    // Turns an LED in strip on
    strips(stripNum, i, colourAdjustedBrightness);
    // Edge case when you are at first strip and cant turn LED 0 off
    if (i != 1) {
      // Turns LED before it off
      strips(stripNum, i - 1, defaultColours[NO_COLOUR]);
    }
    stripsUpdate();
    // Delay between LED iterations
    delay(milliDelay);
  }
}