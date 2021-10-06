const port = process.env.PORT || 3000;

const LOCATION_SETUP_SERVICE = "http://localhost:5000/api";
const LIGHT_SETUP_SERVICE = "http://localhost:5001/api";
const LIGHT_SERVICE = "http://localhost:3050/api";

const express = require("express");
const ejs = require("ejs");
const axios = require("axios");
const helmet = require("helmet");

const app = express();

// Use helmet middleware to set http headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// For rendering ejs files
app.set("view engine", "ejs");

// For loading static files
const base = `${__dirname}/public`;
app.use(express.static("public"));

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Get homepage of the smart lighting application
app.get("/", (req, res) => {
  let requestURL = `${LOCATION_SETUP_SERVICE}/locations/`;
  axios
    .get(requestURL)
    .then((response) => {
      let locations = response.data;
      res.render("home", {
        locations: locations,
      });
    })
    .catch((error) => {
      res.send("ERROR HELLO FROM /");
    });
});

// GET Lights page for displaying lights
app.get("/lights", (req, res) => {
  let requestURL = `${LIGHT_SETUP_SERVICE}/lights/all`;
  axios.get(requestURL).then((response) => {
    let deviceList = response.data;
    res.render("lights", {
      deviceList: deviceList,
    });
  });
});

// GET Add lights page for adding new lights
app.get("/add-lights", (req, res) => {
  let error_display = "none";
  let error_message = "";
  res.render("add-lights", {
    error_display: error_display,
    error_message: error_message,
  });
});

// POST Add new light
app.post("/add-lights", (req, res) => {
  let requestURL = `${LIGHT_SETUP_SERVICE}/lights`;
  axios
    .post(requestURL, req.body)
    .then((response) => {
      if (response.data == "New Light Added") {
        res.redirect("/lights");
      } else if (response.data == "Light ID must be unique.") {
        let error_display = "inline-block";
        let error_message = `Light ID must be unique.`;
        res.render("add-lights", {
          error_display: error_display,
          error_message: error_message,
        });
      }
    })
    .catch((error) => {
      let error_display = "inline-block";
      let error_message = "An error occured while saving new light.";
      res.render("add-lights", {
        error_display: error_display,
        error_message: error_message,
      });
    });
});

// GET Delete lights page for deleting lights
app.get("/delete-lights", (req, res) => {
  let requestURL = `${LIGHT_SETUP_SERVICE}/lights/free`;
  axios
    .get(requestURL)
    .then((response) => {
      let deviceList = [];
      response.data.forEach((device) => {
        if (device.location == null) {
          deviceList.push(device);
        }
      });
      res.render("delete-lights", {
        deviceList: deviceList,
        error_message: "None",
      });
    })
    .catch((error) => {
      res.render("delete-lights", {
        error_message: "Error",
      });
    });
});

// POST Delete lights
app.post("/delete-lights", (req, res) => {
  let requestURL = `${LIGHT_SETUP_SERVICE}/delete-lights`;
  axios
    .post(requestURL, req.body)
    .then((response) => {
      res.send("DELETION DONE");
    })
    .catch((error) => {
      res.send("DELETION ERROR");
    });
});

// GET Add new locations to the building
app.get("/add-locations", (req, res) => {
  let requestURL = `${LIGHT_SETUP_SERVICE}/lights/free`;
  axios
    .get(requestURL)
    .then((response) => {
      if (response.data != "ERROR") {
        let freeDevices = {
          freeLights: response.data,
        };
        let error_display = "none";
        let error_message = "";
        res.render("add-location", {
          error_display: error_display,
          error_message: error_message,
          freeDevices: freeDevices,
        });
      } else {
        let error_display = "inline-block";
        let error_message = "An error occured while loading devices.";
        res.render("add-location", {
          error_display: error_display,
          error_message: error_message,
          freeDevices: {},
        });
      }
    })
    .catch((error) => {
      res.redirect("/");
    });
});

// POST Add new locations to the building
app.post("/add-locations", (req, res) => {
  axios
    .post(`${LOCATION_SETUP_SERVICE}/locations`, req.body)
    .then((response) => {
      if (response.data == "New Location Added") {
        res.redirect("/");
      } else if (response.data == "Location already exists") {
        let freeDevURL = `${LIGHT_SETUP_SERVICE}/lights/free`;
        axios
          .get(freeDevURL)
          .then((resp) => {
            let freeDevices = {
              freeLights: resp.data,
            };
            let error_display = "inline-block";
            let error_message = `${req.body.locationName} already saved in Floor ${req.body.floorNo}.`;
            res.render("add-location", {
              error_display: error_display,
              error_message: error_message,
              freeDevices: freeDevices,
            });
          })
          .catch((err) => {
            res.redirect("/add-location");
          });
      }
    })
    .catch((error) => {
      res.redirect("/");
    });
});

// GET Location page
app.get("/location/:locationId", (req, res) => {
  let requestURL = `${LOCATION_SETUP_SERVICE}/locations/${req.params.locationId}`;
  axios
    .get(requestURL)
    .then((response) => {
      let roomInfo = response.data;
      res.render("location", {
        roomInfo: roomInfo,
      });
    })
    .catch((error) => {
      console.log(error);
      res.redirect("/");
    });
});

// GET page for editing location in building
app.get("/edit-location/:locationId", (req, res) => {
  let requestURL = `${LOCATION_SETUP_SERVICE}/locations/${req.params.locationId}`;
  axios
    .get(requestURL)
    .then((response) => {
      roomInfo = response.data;
      let freeDevURL = `${LIGHT_SETUP_SERVICE}/lights/free`;
      axios
        .get(freeDevURL)
        .then((resp) => {
          let freeDevices = {
            freeLights: resp.data,
          };
          res.render("edit-location", {
            roomInfo: roomInfo,
            freeDevices: freeDevices,
          });
        })
        .catch((error) => {
          res.redirect(`/location/${req.params.locationId}`);
        });
    })
    .catch((error) => {
      res.redirect(`/location/${req.params.locationId}`);
    });
});

// POST Add or remove lights from location in building
app.post("/edit-location/:locationId", (req, res) => {
  let requestURL = `${LOCATION_SETUP_SERVICE}/edit-location/${req.params.locationId}`;
  axios
    .post(requestURL, req.body)
    .then((response) => {
      res.redirect(`/edit-location/${req.params.locationId}`);
    })
    .catch((error) => {
      res.redirect(`/edit-location/${req.params.locationId}`);
    });
});

// POST Delete location from building
app.post("/delete-location/:locationId", (req, res) => {
  let requestURL = `${LOCATION_SETUP_SERVICE}/locations/${req.params.locationId}`;
  axios
    .delete(requestURL)
    .then((response) => {
      res.redirect("/");
    })
    .catch((error) => {
      res.redirect("/");
    });
});

// POST Change light state in location
app.post("/light-state/:locationId", (req, res) => {
  const colour = req.body.light_colour;
  const brightness = req.body.light_brightness;
  const mode = req.body.light_mode;
  let on = false;
  if (req.body.light_state) {
    on = true;
  }
  const newLightState = {
    on,
    colour,
    brightness,
    mode,
  };
  let requestURL = `${LIGHT_SERVICE}/light-state/${req.params.locationId}`;
  axios
    .post(requestURL, newLightState)
    .then((response) => {
      res.redirect(`/location/${req.params.locationId}`);
    })
    .catch((error) => {
      console.log(error);
      res.redirect(`/location/${req.params.locationId}`);
    });
});

app.listen(port, () => {
  console.log(`Main Server running on port ${port}`);
});
