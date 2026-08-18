import mongoose, { Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";
import { ROLESMODEL, STATUS } from "../../constants/model.const.js";

//định nghĩa các type cho workspace invitation
export type IWorkspaceInvitation = BaseDocument & {
  workspaceId?: Types.ObjectId;
  invitedUserId?: Types.ObjectId;
  invitedByUserId?: Types.ObjectId;
  role?: string;
  status?: string;
  expiresAt?: Date;
};

const WorkspaceInvitationSchema = new mongoose.Schema(
  {
    workspaceId: { type: Types.ObjectId, ref: "workspace", required: true },
    invitedUserId: { type: Types.ObjectId, ref: "user", required: true },
    invitedByUserId: { type: Types.ObjectId, ref: "user", required: true },
    role:  {
      type: String,
      enum: Object.values(ROLESMODEL),
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.PENDING,
    },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// Index
WorkspaceInvitationSchema.index({ workspaceId: 1 });
WorkspaceInvitationSchema.index({ invitedUserId: 1 });
WorkspaceInvitationSchema.index({ invitedByUserId: 1 });
WorkspaceInvitationSchema.index({ workspaceId: 1, invitedUserId: 1 }, { unique: true });
const WorkspaceInvitationModel = mongoose.model<IWorkspaceInvitation>(
  "workspaceInvitation",
  WorkspaceInvitationSchema,
);
export { WorkspaceInvitationModel };
