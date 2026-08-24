import mongoose from "mongoose";
import projectModel from "../models/project.model.js";
import taskModel from "../models/task.model.js";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";

const getTask = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  if (!projectId) {
    throw new ApiError(404, "project id is missing");
  }

  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Proejct not found");
  }

  const tasks = await taskModel
    .find({ project: projectId })
    .populate("assignedTo", "avatar, username, email");

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  if (!taskId) {
    throw new ApiError(404, "Task id is missing");
  }

  const task = await taskModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subTasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length == 0) {
    throw new ApiError(404, "Task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { task }, "Task fetched successfully"));
});

const createTask = asyncHandler(async (req, res, next) => {
  const { title, subTitle, description, assignedTo, status } = req.body;
  const { projectId } = req.params;

  if (!projectId) {
    throw new ApiError(404, "Project id is missing");
  }

  const project = await projectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  const file = req.file;
  const { url } = await uploader.upload();

  const task = await taskModel.create({
    title,
    subTitle,
    description,
    status,
    assignedTo: new mongoose.Types.ObjectId(assignedTo),
    project: new mongoose.Types.ObjectId(projectId),
    assignedBy: new mongoose.Types.ObjectId(req.userId),
    attachments: url,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const updateTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { title, description, assignedTo, status } = req.body;
  const task = await taskModel.findByIdAndDelete(taskId, {
    title,
    description,
    assignedTo,
    status,
  });

  if (!task) {
    throw new ApiError(400, "Failed to update task");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await taskModel.findByIdAndDelete(taskId);

  if (!task) {
    throw new ApiError(400, "Failed to delete task");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task has been deleted successfully"));
});

export { getTask, getTaskById, createTask, updateTask, deleteTask };
