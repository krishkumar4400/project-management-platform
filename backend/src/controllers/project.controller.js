import mongoose from "mongoose";
import projectMemberModel from "../models/projectMember.model.js";
import asyncHandler from "../utils/async-handler.js";
import projectModel from "../models/project.model.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants";
import userModel from "../models/user.model.js";

const getProjects = asyncHandler(async (req, res, next) => {
  const projects = await projectMemberModel.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "projects",
        foreignField: "_id",
        as: "projects",
        pipeline: [
          {
            $lookup: {
              from: "projectmember",
              localField: "_id",
              foreignField: "projects",
              as: "projectmembers",
            },
          },
          {
            $addFields: {
              members: {
                $size: "$projectmembers",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$project",
    },
    {
      $project: {
        project: {
          _id: 1,
          name: 1,
          description: 1,
          members: 1,
          createdAt: 1,
          createdBy: 1,
        },
        role: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "project fetched successfully"));
});

const createProject = asyncHandler(async (req, res, next) => {
  const { title, subTitle, description } = req.body;

  const project = await projectModel.create({
    title,
    description,
    subTitle,
    createdBy: new mongoose.Types.ObjectId(req.userId),
  });

  const projectMember = projectMemberModel.create({
    project: new mongoose.Types.ObjectId(project._id),
    user: new mongoose.Types.ObjectId(req.userId),
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "project created successfully"));
});

const updateProject = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const { projectId } = req.params;

  const project = await projectModel.findByIdAndUpdate(
    projectId,
    {
      title,
      description,
    },
    {
      new: true,
    },
  );

  if (!project) {
    throw new ApiError(400, "Failed to update project");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, project, "Project has been updated successfully"),
    );
});

const deleteProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;
  const project = await projectModel.findByIdAndDelete(projectId);
  if (!project) {
    throw new ApiError(400, "Failed to delete project");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, project, "Project has been deleted successfully"),
    );
});

const addMembersToProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { email, role } = req.body;

  const member = await userModel.findOne({ email });
  if (!member) {
    throw new ApiError(404, "User doesn't exists with this email address");
  }

  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const projectMember = await projectMemberModel.findByIdAndUpdate(
    {
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.userId),
    },
    {
      user: new mongoose.Types.ObjectId(member._id),
      project: new mongoose.Types.ObjectId(project._id),
    },
    {
      new: true,
      upsert: true,
    },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, projectMember, "Member added to the project"));
});

const getProjectMembers = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;

  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, "project not found");
  }

  const projectMembers = await projectMemberModel.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
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
        user: {
          $arrayElemAt: ["$user", 0],
        },
      },
    },
    {
      $project: {
        project: 1,
        user: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMembers,
        "Project members fetched successfully",
      ),
    );
});

const updateProjectMemberRole = asyncHandler(async (req, res, next) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  if (!AvailableUserRole.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const projectMember = await projectMemberModel.findOneAndUpdate(
    {
      project: projectId,
      user: userId,
    },
    {
      $set: {
        role: role,
      },
    },
    {
      new: true,
    },
  );

  if (!projectMember) {
    throw new ApiError(404, "Member was not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        `Role updated to ${role} successfully`,
      ),
    );
});

const deleteMember = asyncHandler(async (req, res, next) => {
  const { projectId, userId } = req.params;

  const member = await projectMemberModel.findOneAndDelete({
    project: projectId,
    user: userId,
  });

  if (!member) {
    throw new ApiError(400, "Failed to delete member");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        member,
        "Member has been deleted from the project successfully",
      ),
    );
});
