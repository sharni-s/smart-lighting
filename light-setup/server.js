const port = process.env.PORT || 5001;

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

// Connect to database
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Custom middleware that attaches response headers for cross-origin requests
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Replace "*" with main server URL
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const Light = require("./models/lights");

app.get("/api", (req, res) => {
  res.send("Welcome to Smart Lighting Light Setup API!");
});

// GET free/all lights from building
app.get("/api/lights/:option", (req, res) => {
  /**
   * Check parameters to categorize request and send data accordingly
   */
  if (req.params.option == "all") {
    Light.find()
      .then((response) => {
        res.send(response);
      })
      .catch((error) => {
        res.send(error);
      });
  } else if (req.params.option == "free") {
    Light.find({ location: null })
      .then((response) => {
        res.send(response);
      })
      .catch((error) => {
        res.send(error);
      });
  }
});

// POST Add new lights
app.post("/api/lights", (req, res) => {
  /**
   * RUN TIME TYPE CHECKING BEFORE ADDING NEW LIGHT
   */
  if (typeof req.body == "object") {
    if (
      typeof req.body.deviceId == "string" &&
      typeof req.body.deviceName == "string" &&
      typeof req.body.deviceMan == "string" &&
      typeof req.body.product == "string"
    ) {
      Light.exists({ _id: req.body.deviceId })
        .then((response) => {
          if (response == true) {
            res.send("Light ID must be unique.");
          } else {
            const newLight = new Light({
              _id: req.body.deviceId,
              name: req.body.deviceName,
              manufacturer: req.body.deviceMan,
              product_name: req.body.product,
              location: null,
            });
            newLight
              .save()
              .then((doc) => {
                res.send("New Light Added");
              })
              .catch((error) => {
                res.send(error);
              });
          }
        })
        .catch((error) => {
          res.send(error);
        });
    }
  }
});

// DELETE Lights
app.post("/api/delete-lights", (req, res) => {
  /**
   * RUN TIME TYPE CHECKING BEFORE DELETING LIGHTS
   */
  if (Array.isArray(req.body.deviceIds)) {
    Light.deleteMany({
      _id: { $in: req.body.deviceIds },
    })
      .then((response) => {
        res.send("DELETION DONE");
      })
      .catch((error) => {
        res.send(error);
      });
  }
});

app.listen(port, () => {
  console.log(`Light Setup Service Server running on port ${port}`);
});
