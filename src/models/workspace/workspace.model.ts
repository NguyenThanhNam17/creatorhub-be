import mongoose, { Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";

//định nghĩa các type cho workspace
export type IWorkspace = BaseDocument & {
  name?: string;
  description?: string;
  category?: string;
  ownerId?: Types.ObjectId;
  isActive?: boolean;
  isDefault?: boolean;
};

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    ownerId: { type: Types.ObjectId, ref: "user", required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);
// Index
WorkspaceSchema.index({ ownerId: 1 });

const WorkspaceModel = mongoose.model<IWorkspace>("workspace", WorkspaceSchema);
export { WorkspaceModel };
