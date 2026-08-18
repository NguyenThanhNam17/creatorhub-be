import mongoose, { Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";
import { ROLESMODEL } from "../../constants/model.const.js";

//định nghĩa các type cho workspace member
export type IWorkspaceMember = BaseDocument & {
  workspaceId?: Types.ObjectId;
  userId?: Types.ObjectId;
  role?: string;
  joinedAt?: Date;
  isActive?: boolean;
};

const WorkspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: { type: Types.ObjectId, ref: "workspace", required: true },
    userId: { type: Types.ObjectId, ref: "user", required: true },
    role:  {
      type: String,
      enum: Object.values(ROLESMODEL),
    },
    joinedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// Index
WorkspaceMemberSchema.index({ workspaceId: 1 });
WorkspaceMemberSchema.index({ userId: 1 });

const WorkspaceMemberModel = mongoose.model<IWorkspaceMember>(
  "workspaceMember",
  WorkspaceMemberSchema,
);
export { WorkspaceMemberModel };
