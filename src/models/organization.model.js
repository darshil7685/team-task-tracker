const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Organization name must not exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description must not exceed 500 characters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
