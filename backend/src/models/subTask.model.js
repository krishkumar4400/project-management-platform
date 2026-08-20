import mongoose from "mongoose";

const subTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task id is required"],
    },
    createbBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy id is missing"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const subTaskModel =
  mongoose.models.SubTask || mongoose.model("SubTask", subTaskSchema);

export default subTaskModel;

