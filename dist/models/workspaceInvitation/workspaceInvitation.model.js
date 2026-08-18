import mongoose, { Types } from "mongoose";
import { ROLESMODEL, STATUS } from "../../constants/model.const.js";
const WorkspaceInvitationSchema = new mongoose.Schema({
    workspaceId: { type: Types.ObjectId, ref: "workspace", required: true },
    invitedUserId: { type: Types.ObjectId, ref: "user", required: true },
    invitedByUserId: { type: Types.ObjectId, ref: "user", required: true },
    role: {
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
}, {
    timestamps: true,
});
// Index
WorkspaceInvitationSchema.index({ workspaceId: 1 });
WorkspaceInvitationSchema.index({ invitedUserId: 1 });
WorkspaceInvitationSchema.index({ invitedByUserId: 1 });
WorkspaceInvitationSchema.index({ workspaceId: 1, invitedUserId: 1 }, { unique: true });
const WorkspaceInvitationModel = mongoose.model("workspaceInvitation", WorkspaceInvitationSchema);
export { WorkspaceInvitationModel };
