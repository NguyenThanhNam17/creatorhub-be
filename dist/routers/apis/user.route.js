import { ErrorHelper } from "../../base/error.js";
import { BaseRoute, } from "../../base/baseRoutes.js";
import { UserModel } from "../../models/user/user.model.js";
import { TokenHelper } from "../../helper/token.helper.js";
import passwordHash from "password-hash";
import { ROLES } from "../../constants/role.const.js";
import { UserHelper } from "../../models/user/user.helper.js";
class UserRoute extends BaseRoute {
    constructor() {
        super();
    }
    customRouting() {
        this.router.post("/register", this.route(this.register));
        this.router.post("/login", this.route(this.login));
        this.router.get("/getAllUser", this.route(this.getAllUser));
        this.router.get("/getMe", this.authentication, this.route(this.getMe));
        this.router.get("/getOneUser/:id", this.route(this.getOneUser));
        this.router.get("/findOne", this.authentication, this.route(this.findOne));
        this.router.post("/createUser", this.authentication, this.route(this.createUser));
        this.router.post("/deleteUser", this.authentication, this.route(this.deleteUser));
        this.router.post("/updateUser", this.authentication, this.route(this.updateUser));
        this.router.post("/logout", this.authentication, this.route(this.logout));
        this.router.post("/changePassword", this.authentication, this.route(this.changePassword));
        this.router.post("/updateProfile", this.authentication, this.route(this.updateProfile));
        this.router.get("/searchUser", this.authentication, this.route(this.searchUser));
    }
    async authentication(req, res, next) {
        try {
            if (!req.get("x-token")) {
                throw ErrorHelper.unauthorized();
            }
            const tokenData = TokenHelper.decodeToken(req.get("x-token"));
            if (ROLES.ALL.includes(tokenData.role_)) {
                const user = await UserModel.findById(tokenData._id);
                if (!user) {
                    throw ErrorHelper.userNotExist();
                }
                if (!user.isActive) {
                    throw ErrorHelper.userWasBlock();
                }
                if (user.key != tokenData.key) {
                    throw ErrorHelper.userWasOut();
                }
                req.tokenInfo = tokenData;
                next();
            }
            else {
                throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập hệ thống");
            }
        }
        catch {
            throw ErrorHelper.unauthorized();
        }
    }
    async searchUser(req, res) {
        const keyword = String(req.query.keyword || "").trim();
        if (!keyword) {
            throw ErrorHelper.requestDataInvalid("keyword");
        }
        const users = await UserModel.find({
            isActive: true,
            $or: [
                {
                    username: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    phone: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
            ],
        }).select("-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: {
                users,
            },
        });
    }
    async updateProfile(req, res) {
        let { username, phone, email, avatar } = req.body;
        const user = await UserModel.findById(req.tokenInfo._id);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        if (username && username != user.username) {
            const existed = await UserModel.findOne({
                username,
            });
            if (existed) {
                throw ErrorHelper.userExisted();
            }
            user.username = username.trim();
        }
        if (phone && phone != user.phone) {
            const existed = await UserModel.findOne({
                phone,
            });
            if (existed) {
                throw ErrorHelper.userExisted();
            }
            user.phone = phone.trim();
        }
        if (email && email != user.email) {
            const existed = await UserModel.findOne({
                email,
            });
            if (existed) {
                throw ErrorHelper.userExisted();
            }
            user.email = email.trim();
        }
        if (avatar) {
            user.avatar = avatar;
        }
        await user.save();
        const safeUser = await UserModel.findById(user._id).select("-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Cập nhật thành công",
            data: {
                user: safeUser,
            },
        });
    }
    async changePassword(req, res) {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw ErrorHelper.requestDataInvalid("request data");
        }
        const user = await UserModel.findById(req.tokenInfo._id);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        const check = passwordHash.verify(oldPassword, user.password);
        if (!check) {
            throw ErrorHelper.userPasswordNotCorrect();
        }
        user.password = passwordHash.generate(newPassword);
        await user.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Đổi mật khẩu thành công",
        });
    }
    async register(req, res) {
        const { username, phone, email, password } = req.body;
        if (!username || !phone || !email || !password) {
            throw ErrorHelper.requestDataInvalid("data invalid");
        }
        // kiểm tra user đã tồn tại
        const existing = await UserModel.findOne({
            $or: [{ phone }, { email }, { username }],
        });
        if (existing) {
            throw ErrorHelper.userExisted();
        }
        const key = TokenHelper.generateKey();
        // tạo user (chưa có walletId)
        let user = new UserModel({
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: passwordHash.generate(password),
            role: ROLES.CLIENT,
            key,
        });
        await user.save();
        let safeUser = await UserModel.findById(user._id).select("-password -key");
        // response
        res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: { user: safeUser },
        });
    }
    async logout(req, res) {
        const user = await UserModel.findById(req.tokenInfo._id);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        user.key = TokenHelper.generateKey();
        await user.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Đăng xuất thành công",
        });
    }
    async getMe(req, res) {
        const user = await UserModel.findById(req.tokenInfo._id).select("-password -key");
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: { user },
        });
    }
    async login(req, res) {
        let { username, password } = req.body;
        if (!username || !password) {
            throw ErrorHelper.requestDataInvalid("request data");
        }
        let user = await UserModel.findOne({
            $or: [{ phone: username }, { username: username }, { email: username }],
        });
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        if (!user.isActive) {
            throw ErrorHelper.userWasBlock();
        }
        let check = passwordHash.verify(password, user.password);
        if (!check) {
            throw ErrorHelper.userPasswordNotCorrect();
        }
        const key = TokenHelper.generateKey();
        user.key = key;
        user.lastLoginAt = new Date();
        await user.save();
        const safeUser = await UserModel.findById(user._id).select("-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                user: safeUser,
                token: new UserHelper(user).getToken(key),
            },
        });
    }
    async getAllUser(req, res) {
        let users = await UserModel.find().select("-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                users,
            },
        });
    }
    async getOneUser(req, res) {
        let { id } = req.params;
        if (!id) {
            throw ErrorHelper.requestDataInvalid("request data");
        }
        let user = await UserModel.findById(id).select("-password -key");
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                user,
            },
        });
    }
    async findOne(req, res) {
        let { username } = req.body;
        if (!username) {
            throw ErrorHelper.requestDataInvalid("request data");
        }
        let user = await UserModel.findOne({ username: username }).select("-password -key");
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                user,
            },
        });
    }
    async createUser(req, res) {
        if (ROLES.ADMIN != req.tokenInfo.role_) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập hệ thống");
        }
        let { username, phone, email, password } = req.body;
        if (!username || !phone || !email || !password) {
            throw ErrorHelper.requestDataInvalid("request data");
        }
        const existed = await UserModel.findOne({
            $or: [{ username }, { email }, { phone }],
        });
        if (existed) {
            throw ErrorHelper.userExisted();
        }
        const key = TokenHelper.generateKey();
        let user = new UserModel({
            username: username,
            phone: phone,
            email: email,
            password: passwordHash.generate(password),
            key: key,
            role: ROLES.ADMIN,
        });
        await user.save();
        const safeUser = await UserModel.findById(user._id).select("-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                user: safeUser,
            },
        });
    }
    async deleteUser(req, res) {
        if (ROLES.ADMIN != req.tokenInfo.role_) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập hệ thống");
        }
        let { id } = req.body;
        let user = await UserModel.findById(id);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        await UserModel.deleteOne({ _id: id });
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                user,
            },
        });
    }
    async updateUser(req, res) {
        let { id, username, phone, password, email } = req.body;
        if (req.tokenInfo.role_ !== ROLES.ADMIN && req.tokenInfo._id !== id) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập hệ thống");
        }
        let user = await UserModel.findById(id);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        user.username = username || user.username;
        user.phone = phone || user.phone;
        user.email = email || user.email;
        if (password) {
            user.password = passwordHash.generate(password);
        }
        await user.save();
        const safeUser = await UserModel.findById(user._id).select("-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "succes",
            data: {
                user: safeUser,
            },
        });
    }
}
export default new UserRoute().router;
