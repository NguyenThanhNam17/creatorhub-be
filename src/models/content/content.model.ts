import mongoose, { Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";

//định nghĩa các type cho content
export type IContent = BaseDocument & {
  title?: string;
  description?: string;
  status?: string;
  thumbnailUrl?: string;
  workspaceId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  publishedAt?: Date;
  joinedAt?: Date;
  isActive?: boolean;
};

const ContentSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

// Index
ContentSchema.index({ workspaceId: 1 });
ContentSchema.index({ status: 1 });
ContentSchema.index({ createdBy: 1 });
ContentSchema.index({ assignedTo: 1 });

const ContentModel = mongoose.model<IContent>("content", ContentSchema);
export { ContentModel };
