import mongoose from "mongoose";
import { ROLES } from "../../constants/role.const.js";
const UserSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
});
const UserModel = mongoose.model("user", UserSchema);
export { UserModel };
