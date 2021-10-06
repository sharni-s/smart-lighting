const mqtt = require("mqtt");
const SerialPort = require("serialport");
const dotenv = require("dotenv");
dotenv.config();

// Connect to serial port to write to LEDs
let myPort = new SerialPort("COM3", 9600);

var options = {
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  protocol: "mqtts",
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

// Initialize the MQTT client
var client = mqtt.connect(options);

// Setup the callbacks
client.on("connect", function () {
  client.subscribe("/smartLighting/light/+");
  console.log("Connected to Secure MQTT Broker");
});

client.on("error", function (error) {
  console.log("Error Connecting to Secure MQTT Broker");
  console.log(error);
});

// Scalability - Define ports for each light
let lightPorts = {
  L1: myPort,
};

client.on("message", (topic, message) => {

  let lightId = topic.split("/")[3];
  let recvJSON = JSON.parse(message.toString());

  // Extract data from the message received
  let state = Number(recvJSON.on);
  let tempBright = Number(recvJSON.brightness);
  let brightness = String(tempBright).padStart(3, "0");
  let mode = recvJSON.mode;
  
  // Convert HEX code to rgb colour
  let red = String(parseInt(recvJSON.colour.slice(1, 3), 16)).padStart(3, "0");
  let green = String(parseInt(recvJSON.colour.slice(3, 5), 16)).padStart(3, "0");
  let blue = String(parseInt(recvJSON.colour.slice(5, 7), 16)).padStart(3, "0");

  let msg = `${state},${brightness},${red},${green},${blue},${mode}\n`;
  
  lightPorts[lightId].write(msg, function (err) {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    console.log("message written");
  });
});
