import mongoose from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    subTitle: {
      type: String,
    },
    description: {
      type: String,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
      required: [true, "Project id is required"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assignee id is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned to Id is missing"],
    },
    status: {
      type: String,
      enum: AvailableTaskStatus,
      default: TaskStatusEnum.TODO,
    },
    attachments: {
      type: [
        {
          url: String,
          mimetype: String,
          size: Number,
        },
      ],
      default: []
    },
  },
  {
    timestamps: true,
  },
);

const taskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default taskModel;
