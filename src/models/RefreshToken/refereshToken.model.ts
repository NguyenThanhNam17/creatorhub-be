import mongoose, { Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";

//định nghĩa các type cho refresh token
export type IRefreshToken = BaseDocument & {
  userId?: Types.ObjectId;
  token?: string;
  expiresAt?: Date;
};

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: Types.ObjectId, ref: "user", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

// Index
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 });

const RefreshTokenModel = mongoose.model<IRefreshToken>(
  "refreshToken",
  RefreshTokenSchema,
);
export { RefreshTokenModel };
