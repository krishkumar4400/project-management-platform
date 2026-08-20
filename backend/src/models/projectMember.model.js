import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants";

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project id is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required"],
    },
    role: {
      type: String,
      enum: AvailableUserRole,
      default: UserRolesEnum.MEMBER,
    },
  },
  {
    timestamps: true,
  },
);

const projectMemberModel =
  mongoose.models.ProjectMember ||
  mongoose.model("ProjectMember", projectMemberSchema);

export default projectMemberModel;
