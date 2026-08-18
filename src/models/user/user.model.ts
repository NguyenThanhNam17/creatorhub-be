import mongoose, { Schema, Types } from "mongoose";
import { BaseDocument } from "../../base/baseModel.js";
import { ROLES } from "../../constants/role.const.js";

//định nghĩa các type cho user
export type IUser = BaseDocument & {
  username: string;
  phone: string;
  email: string;
  password: string;
  avatar?: string;
  lastLoginAt?: Date;
  key: string;
  role: string;
  isActive: boolean;
};

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    key: { type: String, required: true },
    avatar: { type: String },
    lastLoginAt: { type: Date },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.CLIENT],
      default: ROLES.CLIENT,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model<IUser>("user", UserSchema);
export { UserModel };
