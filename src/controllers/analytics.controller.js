const Task = require("../models/task.model");
const ApiError = require("../utils/apiError");

const taskAnalytics = async (req, res, next) => {
  try {
    const orgId = req.user.organization;
    const now = new Date();

    const [overdueByUser, completionStats, statusSummary] = await Promise.all([
      Task.aggregate([
        {
          $match: {
            organization: orgId,
            status: { $nin: ["DONE", "BLOCKED"] },
            due_date: { $lt: now, $ne: null },
            assignee: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignee",
            overdueCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$user.name",
            email: "$user.email",
            overdueCount: 1,
          },
        },
        { $sort: { overdueCount: -1 } },
      ]),

      Task.aggregate([
        {
          $match: {
            organization: orgId,
            status: "DONE",
            completedAt: { $ne: null },
            assignee: { $ne: null },
          },
        },
        {
          $addFields: {
            completionHours: {
              $divide: [
                { $subtract: ["$completedAt", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        {
          $group: {
            _id: "$assignee",
            avgCompletionHours: { $avg: "$completionHours" },
            completedCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$user.name",
            email: "$user.email",
            avgCompletionHours: { $round: ["$avgCompletionHours", 2] },
            completedCount: 1,
          },
        },
        { $sort: { avgCompletionHours: 1 } },
      ]),

      Task.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { status: 1 } },
      ]),
    ]);

    res.json({
      data: {
        overdueByUser,
        completionStats,
        statusSummary,
        generatedAt: now.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { taskAnalytics };
