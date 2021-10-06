const mongoose = require("mongoose");

const LightSchema = new mongoose.Schema({
  _id: String,
  name: String,
  manufacturer: String,
  product_name: String,
  location: Object,
  state: {
    on: Boolean,
    colour: String,
    brightness: Number,
    mode: String,
  },
});

module.exports = new mongoose.model("Light", LightSchema);
