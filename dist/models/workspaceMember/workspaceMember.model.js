import mongoose, { Types } from "mongoose";
import { ROLESMODEL } from "../../constants/model.const.js";
const WorkspaceMemberSchema = new mongoose.Schema({
    workspaceId: { type: Types.ObjectId, ref: "workspace", required: true },
    userId: { type: Types.ObjectId, ref: "user", required: true },
    role: {
        type: String,
        enum: Object.values(ROLESMODEL),
    },
    joinedAt: { type: Date },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
// Index
WorkspaceMemberSchema.index({ workspaceId: 1 });
WorkspaceMemberSchema.index({ userId: 1 });
const WorkspaceMemberModel = mongoose.model("workspaceMember", WorkspaceMemberSchema);
export { WorkspaceMemberModel };
