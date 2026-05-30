const Task = require("../models/task.model");
const { STATUS_TRANSITIONS } = require("../models/task.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/apiError");
const cache = require("../services/cache.service");

const listTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, assignee, project } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { organization: req.user.organization };

    if (req.user.role === "MEMBER") {
      filter.assignee = req.user._id;
    } else {
      if (assignee) filter.assignee = assignee;
    }

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (project)  filter.project  = project;

    const cacheFilters = { ...filter, page, limit };
    const cacheKey = cache.buildTaskListKey(
      req.user.organization.toString(),
      cacheFilters
    );

    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("assignee", "name email role")
        .populate("createdBy", "name email")
        .populate("project", "name status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    const response = {
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    await cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("assignee", "name email role")
      .populate("createdBy", "name email")
      .populate("project", "name status")
      .lean();

    if (!task) throw ApiError.notFound("Task not found");

    if (
      req.user.role === "MEMBER" &&
      task.assignee?._id?.toString() !== req.user._id.toString()
    ) {
      throw ApiError.forbidden("You can only view tasks assigned to you");
    }

    res.json({ data: task });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, assignee, due_date, project } = req.body;

    if (assignee) {
      const assigneeUser = await User.findOne({
        _id: assignee,
        organization: req.user.organization,
        isActive: true,
      }).lean();
      if (!assigneeUser) {
        throw ApiError.badRequest(
          "Assignee not found or does not belong to your organization",
          "INVALID_ASSIGNEE"
        );
      }
    }

    if (project) {
      const proj = await Project.findOne({
        _id: project,
        organization: req.user.organization,
      }).lean();
      if (!proj) {
        throw ApiError.badRequest(
          "Project not found or does not belong to your organization",
          "INVALID_PROJECT"
        );
      }
    }

    const task = await Task.create({
      title,
      description,
      priority,
      assignee: assignee || null,
      due_date: due_date || null,
      project: project || null,
      organization: req.user.organization,
      createdBy: req.user._id,
    });

    await cache.invalidateTaskCaches(
      req.user.organization.toString(),
      assignee?.toString()
    );

    const populated = await task.populate([
      { path: "assignee", select: "name email role" },
      { path: "createdBy", select: "name email" },
      { path: "project", select: "name status" },
    ]);

    res.status(201).json({ data: populated });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, assignee, due_date, project } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!task) throw ApiError.notFound("Task not found");

    if (assignee !== undefined && assignee !== null) {
      const assigneeUser = await User.findOne({
        _id: assignee,
        organization: req.user.organization,
        isActive: true,
      }).lean();
      if (!assigneeUser) {
        throw ApiError.badRequest(
          "Assignee not found or does not belong to your organization",
          "INVALID_ASSIGNEE"
        );
      }
    }

    if (project !== undefined && project !== null) {
      const proj = await Project.findOne({
        _id: project,
        organization: req.user.organization,
      }).lean();
      if (!proj) {
        throw ApiError.badRequest(
          "Project not found or does not belong to your organization",
          "INVALID_PROJECT"
        );
      }
    }

    const oldAssignee = task.assignee?.toString();

    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (priority    !== undefined) task.priority    = priority;
    if (assignee    !== undefined) task.assignee    = assignee;
    if (due_date    !== undefined) task.due_date    = due_date;
    if (project     !== undefined) task.project     = project;

    await task.save();

    await cache.invalidateTaskCaches(req.user.organization.toString(), oldAssignee);
    if (assignee && assignee !== oldAssignee) {
      await cache.invalidateTaskCaches(
        req.user.organization.toString(),
        assignee.toString()
      );
    }

    const populated = await task.populate([
      { path: "assignee", select: "name email role" },
      { path: "createdBy", select: "name email" },
      { path: "project", select: "name status" },
    ]);

    res.json({ data: populated });
  } catch (err) {
    next(err);
  }
};

const transitionStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!task) throw ApiError.notFound("Task not found");

    const isAssignee  = task.assignee?.toString() === req.user._id.toString();
    const isPrivileged = ["ADMIN", "MANAGER"].includes(req.user.role);

    if (!isAssignee && !isPrivileged) {
      throw ApiError.forbidden(
        "Only the task assignee, a Manager, or an Admin can change task status"
      );
    }

    const allowed = STATUS_TRANSITIONS[task.status];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition: '${task.status}' → '${newStatus}'. Allowed: ${
          allowed.join(", ") || "none (terminal state)"
        }`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    task.status = newStatus;
    if (newStatus === "DONE") task.completedAt = new Date();

    await task.save();

    await cache.invalidateTaskCaches(
      req.user.organization.toString(),
      task.assignee?.toString()
    );

    const populated = await task.populate([
      { path: "assignee", select: "name email role" },
      { path: "createdBy", select: "name email" },
      { path: "project", select: "name status" },
    ]);

    res.json({ data: populated });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!task) throw ApiError.notFound("Task not found");

    await cache.invalidateTaskCaches(
      req.user.organization.toString(),
      task.assignee?.toString()
    );

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  transitionStatus,
  deleteTask,
};
