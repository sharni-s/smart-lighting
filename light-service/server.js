const port = process.env.PORT || 3050;

const mqtt = require("mqtt");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Use helmet middleware for setting http headers
app.use(helmet());

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom middleware that attaches response headers for cross-origin requests
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Replace "*" with main server URL
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Connect to database
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Location = require("./models/locations");
const Light = require("./models/lights");

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
  console.log("Connected to Secure MQTT Broker");
});

client.on("error", function (error) {
  console.log("Error Connecting to Secure MQTT Broker");
  console.log(error);
});

app.get("/api", (req, res) => {
  res.send("Welcome to Smart Lighting API!");
});

app.post("/api/light-state/:locationId", (req, res) => {
  /**
   * RUN TIME TYPE CHECKING BEFORE CHANGING LIGHT STATE
   */
  console.log(req.body);
  if (typeof req.body == "object") {
    if (
      typeof req.body.on == "boolean" &&
      typeof req.body.brightness == "string" &&
      typeof req.body.colour == "string" &&
      typeof req.body.mode == "string"
    ) {
      // console.log("IN");
      Location.findOneAndUpdate(
        { _id: req.params.locationId },
        { light_state: req.body },
        { returnNewDocument: true },
        (err, doc) => {
          if (err) {
            res.send(err);
          } else {
            const newState = {
              on: req.body.on,
              brightness: req.body.brightness,
              colour: req.body.colour,
              mode: req.body.mode,
            };
            Light.updateMany(
              { _id: { $in: doc.lights } },
              { state: newState },
              (err, doc2) => {
                if (err) {
                  res.send(err);
                } else {
                  // Publish to all lights in the room
                  doc.lights.forEach((lightId) => {
                    let topic = `/smartLighting/light/${lightId}`;
                    let message = {
                      on: newState.on,
                      brightness: newState.brightness,
                      colour: newState.colour,
                      mode: newState.mode,
                    };
                    message = JSON.stringify(message);
                    client.publish(topic, message);
                  });
                  res.send("DONE");
                }
              }
            );
          }
        }
      );
    }
  }
});

app.listen(port, () => {
  console.log(`Light Service Server running on port ${port}`);
});
