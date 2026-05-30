const mongoose = require("mongoose");

const STATUSES = ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [150, "Project name must not exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must not exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "ACTIVE",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1, status: 1 });
projectSchema.index({ organization: 1, members: 1 });

module.exports = mongoose.model("Project", projectSchema);
module.exports.PROJECT_STATUSES = STATUSES;
