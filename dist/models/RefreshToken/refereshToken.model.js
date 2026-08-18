import mongoose, { Types } from "mongoose";
const RefreshTokenSchema = new mongoose.Schema({
    userId: { type: Types.ObjectId, ref: "user", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true,
});
// Index
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 });
const RefreshTokenModel = mongoose.model("refreshToken", RefreshTokenSchema);
export { RefreshTokenModel };
