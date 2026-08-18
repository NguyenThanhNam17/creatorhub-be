import mongoose, { Types } from "mongoose";
const WorkspaceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    ownerId: { type: Types.ObjectId, ref: "user", required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Index
WorkspaceSchema.index({ ownerId: 1 });
const WorkspaceModel = mongoose.model("workspace", WorkspaceSchema);
export { WorkspaceModel };
