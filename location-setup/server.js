const port = process.env.PORT || 5000;

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
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const Location = require("./models/locations");
const Light = require("./models/lights");

app.get("/api", (req, res) => {
  res.send("Welcome to Smart Lighting Location Setup API!");
});

// GET list of locations or details of a location with id
app.get("/api/locations/:locationId?", (req, res) => {
  /**
   * Check parameters to categorize request and send data accordingly
   */
  if (!req.params.locationId) {
    Location.find({}, "_id name floorNo lights")
      .then((response) => {
        res.send(response);
      })
      .catch((error) => {
        res.send(error);
      });
  } else {
    Location.find({ _id: req.params.locationId })
      .then((response) => {
        locationDetails = JSON.parse(JSON.stringify(response[0]));
        let lights = locationDetails.lights;
        if (typeof locationDetails.lights == "string") {
          lights = [locationDetails.lights];
        }
        locationDetails.lights = [];
        Light.find({ _id: { $in: lights } }, "_id name")
          .then((res1) => {
            res1.forEach((light) => {
              locationDetails.lights.push({ id: light._id, name: light.name });
            });
            res.send(locationDetails);
          })
          .catch((error) => {
            res.send(error);
          });
      })
      .catch((error) => {
        res.send(error);
      });
  }
});

// POST Add new location to the building
app.post("/api/locations", (req, res) => {
  /**
   * RUN TIME TYPE CHECKING BEFORE ADDING NEW LOCATION TO THE BUILDING
   */
  if (typeof req.body == "object") {
    Location.exists({
      name: req.body.locationName,
      floorNo: Number(req.body.floorNo),
    })
      .then((response) => {
        if (response == true) {
          res.send("Location already exists");
        } else {
          const newLocation = new Location({
            name: req.body.locationName,
            floorNo: req.body.floorNo,
            lights: req.body.lights,
          });
          if (req.body.lights) {
            newLocation.light_state = {
              on: false,
              colour: "#FFFFFF",
              brightness: 100,
              mode: "Manual",
            };
          }
          newLocation
            .save()
            .then((doc) => {
              let thisLocation = doc.name + " Floor " + doc.floorNo;
              const deviceLocation = {
                id: doc._id,
                name: thisLocation,
              };
              Light.updateMany(
                { _id: { $in: doc.lights } },
                { location: deviceLocation, state: newLocation.light_state },
                (err1, doc1) => {
                  if (err1) {
                    res.send(err1);
                  } else {
                    res.send("New Location Added");
                  }
                }
              );
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
});

// POST Edit lights in location
app.post("/api/edit-location/:locationId", (req, res) => {
  /**
   * RUN TIME TYPE CHECKING TO CONVERT REQUEST DATA TO THE REQUIRED TYPE
   */
  let newLights = [];
  if (typeof req.body.lights == "string") {
    newLights = [req.body.lights];
  } else if (Array.isArray(req.body.lights)) {
    newLights = req.body.lights;
  }
  console.log("newLights = ", newLights);
  Location.findOneAndUpdate(
    { _id: req.params.locationId },
    { lights: newLights }
  )
    .then((doc) => {
      let thisLocation = doc.name + " Floor " + doc.floorNo;
      const deviceLocation = {
        id: doc._id,
        name: thisLocation,
      };
      console.log("DOC LIGHTS +++ ", doc.lights);
      Light.updateMany({ _id: { $in: doc.lights } }, { location: null })
        .then((res1) => {
          Light.updateMany(
            { _id: { $in: newLights } },
            { location: deviceLocation }
          )
            .then((res2) => {
              res.send("DONE");
            })
            .catch((err2) => {
              res.send(err2);
            });
        })
        .catch((err1) => {
          res.send(err1);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

// DELETE Remove Location from building
app.delete("/api/locations/:locationId", (req, res) => {
  Location.findOneAndDelete({ _id: req.params.locationId }, (err, doc) => {
    if (err) {
      res.send(err);
    } else {
      Light.updateMany({ _id: { $in: doc.lights } }, { location: null })
        .then((res1) => {
          res.send("DONE");
        })
        .catch((err1) => {
          res.send(err1);
        });
    }
  });
});

app.listen(port, () => {
  console.log(`Location Setup Service Server running on port ${port}`);
});
