import mongoose, { Types } from "mongoose";
const CommentSchema = new mongoose.Schema({
    contentId: { type: Types.ObjectId, ref: "content", required: true },
    userId: { type: Types.ObjectId, ref: "user", required: true },
    message: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Index
CommentSchema.index({ contentId: 1 });
CommentSchema.index({ userId: 1 });
const CommentModel = mongoose.model("comment", CommentSchema);
export { CommentModel };
