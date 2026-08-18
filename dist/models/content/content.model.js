import mongoose, { Types } from "mongoose";
const ContentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String },
    thumbnailUrl: { type: String },
    workspaceId: { type: Types.ObjectId, ref: "workspace", required: true },
    createdBy: { type: Types.ObjectId, ref: "user", required: true },
    assignedTo: { type: Types.ObjectId, ref: "user" },
    publishedAt: { type: Date },
    joinedAt: { type: Date },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
// Index
ContentSchema.index({ workspaceId: 1 });
ContentSchema.index({ status: 1 });
ContentSchema.index({ createdBy: 1 });
ContentSchema.index({ assignedTo: 1 });
const ContentModel = mongoose.model("content", ContentSchema);
export { ContentModel };
