import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      unique: true,
    },
    subTitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const projectModel =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default projectModel;
