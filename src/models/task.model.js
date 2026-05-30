const mongoose = require("mongoose");

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];

const STATUS_TRANSITIONS = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["IN_REVIEW", "BLOCKED"],
  IN_REVIEW: ["DONE", "BLOCKED", "IN_PROGRESS"],
  DONE: [],
  BLOCKED: ["TODO", "IN_PROGRESS"],
};

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "TODO",
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    due_date: {
      type: Date,
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, organization: 1 });
taskSchema.index({ assignee: 1, organization: 1 });
taskSchema.index({ due_date: 1, organization: 1 });
taskSchema.index({ priority: 1, organization: 1 });
taskSchema.index({ project: 1, organization: 1 });
taskSchema.index({ organization: 1, status: 1, assignee: 1, due_date: 1 });

module.exports = mongoose.model("Task", taskSchema);
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
module.exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
