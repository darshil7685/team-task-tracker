const Project = require("../models/project.model");
const User = require("../models/user.model");
const Task = require("../models/task.model");
const ApiError = require("../utils/apiError");


const listProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { organization: req.user.organization };

    if (req.user.role === "MEMBER") {
      filter.members = req.user._id;
    }

    if (status) filter.status = status;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("createdBy", "name email")
        .populate("members", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("createdBy", "name email")
      .populate("members", "name email role")
      .lean();

    if (!project) throw ApiError.notFound("Project not found");

    if (req.user.role === "MEMBER") {
      const isMember = project.members.some(
        (m) => m._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        throw ApiError.forbidden("You are not a member of this project");
      }
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};


const createProject = async (req, res, next) => {
  try {
    const { name, description, status, members } = req.body;

    if (members && members.length > 0) {
      const validMembers = await User.find({
        _id: { $in: members },
        organization: req.user.organization,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (validMembers.length !== members.length) {
        throw ApiError.badRequest(
          "One or more members were not found in your organization",
          "INVALID_MEMBERS"
        );
      }
    }

    const project = await Project.create({
      name,
      description,
      status,
      members: members || [],
      organization: req.user.organization,
      createdBy: req.user._id,
    });

    const populated = await project.populate([
      { path: "createdBy", select: "name email" },
      { path: "members", select: "name email role" },
    ]);

    res.status(201).json({ data: populated });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!project) throw ApiError.notFound("Project not found");

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();

    const populated = await project.populate([
      { path: "createdBy", select: "name email" },
      { path: "members", select: "name email role" },
    ]);

    res.json({ data: populated });
  } catch (err) {
    next(err);
  }
};

const assignMembers = async (req, res, next) => {
  try {
    const { members } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!project) throw ApiError.notFound("Project not found");

    const validUsers = await User.find({
      _id: { $in: members },
      organization: req.user.organization,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (validUsers.length !== members.length) {
      throw ApiError.badRequest(
        "One or more users were not found in your organization",
        "INVALID_MEMBERS"
      );
    }

    const existingIds = project.members.map((m) => m.toString());
    const toAdd = members.filter((id) => !existingIds.includes(id.toString()));
    project.members.push(...toAdd);

    await project.save();

    const populated = await project.populate([
      { path: "createdBy", select: "name email" },
      { path: "members", select: "name email role" },
    ]);

    res.json({
      data: populated,
      added: toAdd.length,
      skipped: members.length - toAdd.length,
    });
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      organization: req.user.organization,
    });
    if (!project) throw ApiError.notFound("Project not found");

    const before = project.members.length;
    project.members = project.members.filter(
      (m) => m.toString() !== userId
    );

    if (project.members.length === before) {
      throw ApiError.notFound("User is not a member of this project");
    }

    await project.save();

    const populated = await project.populate([
      { path: "createdBy", select: "name email" },
      { path: "members", select: "name email role" },
    ]);

    res.json({ data: populated });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!project) throw ApiError.notFound("Project not found");

    await Task.updateMany(
      { project: project._id },
      { $set: { project: null } }
    );

    res.json({ message: "Project deleted and tasks unlinked successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  assignMembers,
  removeMember,
  deleteProject,
};
