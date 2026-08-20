import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project id is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by id is required"],
    },
  },
  {
    timestamps: true,
  },
);

const notesModel =
  new mongoose.models.Notes() || mongoose.model("Note", notesSchema);

export default notesModel;
