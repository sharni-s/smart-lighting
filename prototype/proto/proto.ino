String ID = "L1";

const int LDR = A0;
const int blue_led_pin = 9;
const int green_led_pin = 10;
const int red_led_pin = 11;

unsigned int state = 0;
float brightness = 255;
unsigned int red_led_value = 0;
unsigned int blue_led_value = 0;
unsigned int green_led_value = 0;
char mode = 'M';

unsigned int red_adjusted_value = 0;
unsigned int blue_adjusted_value = 0;
unsigned int green_adjusted_value = 0;
float ldr_brightness = 0;

//For serial receive.
const byte numChars = 20;
char receivedChars[numChars]; // an array to store the received data
String received;              //The data as a string
boolean newData = false;

void setup()
{
  pinMode(red_led_pin, OUTPUT);
  pinMode(blue_led_pin, OUTPUT);
  pinMode(green_led_pin, OUTPUT);
  Serial.begin(9600);

  analogWrite(red_led_pin, 255);
  analogWrite(green_led_pin, 255);
  analogWrite(blue_led_pin, 255);
}

void loop()
{
  recvWithEndMarker();
  processCommand();

  // For AMBIENT mode
  if (state == 1 && mode == 'A')
  {
    ldr_brightness = 1023 - analogRead(LDR);
    ldr_brightness = ((ldr_brightness / 1023) * 100);
    red_adjusted_value = ((float)(ldr_brightness / 100) * red_led_value);
    green_adjusted_value = ((float)(ldr_brightness / 100) * green_led_value);
    blue_adjusted_value = ((float)(ldr_brightness / 100) * blue_led_value);

    setColour(red_adjusted_value, green_adjusted_value, blue_adjusted_value);
  }
  // For DISCO mode
  else if (state == 1 && mode == 'D')
  {
    unsigned int rgbColour[3];

    // Start off with red.
    rgbColour[0] = 255;
    rgbColour[1] = 0;
    rgbColour[2] = 0;

    // Choose the colours to increment and decrement.
    for (int decColour = 0; decColour < 3; decColour += 1)
    {
      int incColour = decColour == 2 ? 0 : decColour + 1;
      // cross-fade the two colours.
      for (int i = 0; i < 255; i += 1)
      {
        rgbColour[decColour] -= 1;
        rgbColour[incColour] += 1;
        setColour(rgbColour[0], rgbColour[1], rgbColour[2]);
        delay(5);
      }
    }
  }
  delay(100);
}

void setColour(unsigned int red, unsigned int green, unsigned int blue)
{
  analogWrite(red_led_pin, 255 - red);
  analogWrite(green_led_pin, 255 - green);
  analogWrite(blue_led_pin, 255 - blue);
}

void recvWithEndMarker()
{
  static byte ndx = 0;
  char endMarker = '\n';
  char rc;

  while (Serial.available() > 0 && newData == false)
  {
    rc = Serial.read();

    if (rc != endMarker)
    {
      receivedChars[ndx] = rc;
      ndx++;
      if (ndx >= numChars)
      {
        ndx = numChars - 1;
      }
    }
    else
    {
      receivedChars[ndx] = '\0'; // terminate the string
      received = String(receivedChars);
      ndx = 0;
      newData = true;
    }
  }
}

void processCommand()
{
  if (newData == true)
  {
    state = received.substring(0, 1).toInt();
    brightness = received.substring(2, 5).toFloat();
    red_led_value = received.substring(6, 9).toInt();
    green_led_value = received.substring(10, 13).toInt();
    blue_led_value = received.substring(14, 18).toInt();
    mode = received.charAt(18);

    if (state == 0)
    {
      analogWrite(red_led_pin, 255);
      analogWrite(green_led_pin, 255);
      analogWrite(blue_led_pin, 255);
    }
    else
    {
      red_adjusted_value = ((float)(brightness / 100) * red_led_value);
      green_adjusted_value = ((float)(brightness / 100) * green_led_value);
      blue_adjusted_value = ((float)(brightness / 100) * blue_led_value);

      setColour(red_adjusted_value, green_adjusted_value, blue_adjusted_value);
    }
    newData = false;
  }
}
