import mongoose, { Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";

//định nghĩa các type cho comment
export type IComment = BaseDocument & {
  contentId?: Types.ObjectId;
  userId?: Types.ObjectId;
  message?: string;
  isDeleted?: boolean;
};

const CommentSchema = new mongoose.Schema(
  {
    contentId: { type: Types.ObjectId, ref: "content", required: true },
    userId: { type: Types.ObjectId, ref: "user", required: true },
    message: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Index
CommentSchema.index({ contentId : 1 });
CommentSchema.index({ userId: 1 });

const CommentModel = mongoose.model<IComment>(
  "comment",
  CommentSchema,
);
export { CommentModel };
