const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  name: String,
  floorNo: Number,
  lights: Array,
  light_state: {
    on: Boolean,
    colour: String,
    brightness: Number,
    mode: String,
  },
});

module.exports = new mongoose.model("Location", LocationSchema);
