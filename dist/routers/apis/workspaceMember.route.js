import { ErrorHelper } from "../../base/error.js";
import { BaseRoute, } from "../../base/baseRoutes.js";
import { WorkspaceModel } from "../../models/workspace/workspace.model.js";
import { WorkspaceMemberModel } from "../../models/workspaceMember/workspaceMember.model.js";
import { UserModel } from "../../models/user/user.model.js";
import { TokenHelper } from "../../helper/token.helper.js";
import { ROLES } from "../../constants/role.const.js";
class WorkspaceMemberRoute extends BaseRoute {
    constructor() {
        super();
    }
    customRouting() {
        this.router.post("/createWorkspaceMember", this.authentication, this.route(this.createWorkspaceMember));
        this.router.get("/getAllWorkspaceMemberForAdmin", this.authentication, this.route(this.getAllWorkspaceMemberForAdmin));
        this.router.get("/getMyWorkspaces", this.authentication, this.route(this.getMyWorkspaces));
        this.router.get("/getOneWorkspaceMember/:id", this.authentication, this.route(this.getOneWorkspaceMember));
        this.router.get("/getAllUserWorkspaceMemberForAdmin/:id", this.authentication, this.route(this.getAllUserWorkspaceMemberForAdmin));
        this.router.get("/leaveWorkspace/:id", this.authentication, this.route(this.leaveWorkspace));
        this.router.get("/transferWorkspaceOwner/:id", this.authentication, this.route(this.transferWorkspaceOwner));
        this.router.get("/workspaceMembers/:workspaceId", this.authentication, this.route(this.getWorkspaceMembers));
        this.router.post("/removeWorkspaceMember/:id", this.authentication, this.route(this.removeWorkspaceMember));
        this.router.post("/updateWorkspaceMemberRole/:id", this.authentication, this.route(this.updateWorkspaceMemberRole));
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
                throw ErrorHelper.permissionDeny("Bạn không có quyền thực hiện hành động này");
            }
        }
        catch {
            throw ErrorHelper.unauthorized();
        }
    }
    async createWorkspaceMember(req, res) {
        const { workspaceId, userId } = req.body;
        if (!workspaceId) {
            throw ErrorHelper.requestDataInvalid("workspaceId không được để trống");
        }
        if (!userId) {
            throw ErrorHelper.requestDataInvalid("userId không được để trống");
        }
        const currentUserId = req.tokenInfo._id;
        // Kiểm tra Workspace
        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        // Kiểm tra quyền của người đang gọi API
        const currentMember = await WorkspaceMemberModel.findOne({
            workspaceId,
            userId: currentUserId,
            role: "OWNER",
            isActive: true,
        });
        if (!currentMember) {
            throw ErrorHelper.permissionDeny("Chỉ chủ sở hữu mới có thể thêm thành viên");
        }
        // Kiểm tra User được thêm
        const user = await UserModel.findById(userId);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        // Không cho thêm trùng
        const existed = await WorkspaceMemberModel.findOne({
            workspaceId,
            userId,
            isActive: true,
        });
        if (existed) {
            throw ErrorHelper.userExisted();
        }
        // Tạo Member
        const workspaceMember = new WorkspaceMemberModel({
            workspaceId,
            userId,
            role: "VIEWER", // Mặc định là VIEWER
            joinedAt: new Date(),
            isActive: true,
        });
        await workspaceMember.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Thêm thành viên thành công",
            data: {
                workspaceMember,
            },
        });
    }
    async getAllWorkspaceMemberForAdmin(req, res, next) {
        let workspaceMembers = await WorkspaceMemberModel.find({ isActive: true })
            .populate("workspaceId")
            .populate("userId", "-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Lấy danh sách thành viên thành công",
            data: {
                workspaceMembers,
            },
        });
    }
    async getMyWorkspaces(req, res, next) {
        const currentUserId = req.tokenInfo._id;
        // Lấy danh sách workspace mà user hiện tại là thành viên
        const userWorkspaces = await WorkspaceMemberModel.find({
            userId: currentUserId,
            isActive: true,
        }).populate("workspaceId");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Lấy danh sách thành viên thành công",
            data: {
                userWorkspaces,
            },
        });
    }
    async getOneWorkspaceMember(req, res, next) {
        const { id } = req.params;
        const workspaceMember = await WorkspaceMemberModel.findById(id);
        if (!workspaceMember) {
            throw ErrorHelper.recoredNotFound("Workspace Member");
        }
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Lấy thông tin thành viên thành công",
            data: {
                workspaceMember,
            },
        });
    }
    async getAllUserWorkspaceMemberForAdmin(req, res) {
        const { id } = req.params;
        const workspaceMember = await WorkspaceMemberModel.find({
            userId: id,
            isActive: true,
        })
            .populate("workspaceId")
            .populate("userId", "-password -key");
        if (!workspaceMember) {
            throw ErrorHelper.recoredNotFound("Workspace Member");
        }
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Lấy thông tin thành viên thành công",
            data: {
                workspaceMember,
            },
        });
    }
    async leaveWorkspace(req, res) {
        const currentUserId = req.tokenInfo._id;
        const { id } = req.params;
        const workspaceMember = await WorkspaceMemberModel.findOne({
            _id: id,
            userId: currentUserId,
            isActive: true,
        });
        if (!workspaceMember) {
            throw ErrorHelper.recoredNotFound("Workspace Member");
        }
        if (workspaceMember.role === "OWNER") {
            throw ErrorHelper.permissionDeny("Chủ sở hữu không thể rời khỏi workspace");
        }
        workspaceMember.isActive = false;
        await workspaceMember.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Rời khỏi workspace thành công",
            data: {
                workspaceMember,
            },
        });
    }
    async transferWorkspaceOwner(req, res) {
        const currentUserId = req.tokenInfo._id;
        const { id } = req.params;
        const { newOwnerId } = req.body;
        if (!newOwnerId) {
            throw ErrorHelper.requestDataInvalid("newOwnerId không được để trống");
        }
        // Tìm WorkspaceMember hiện tại
        const currentOwnerMember = await WorkspaceMemberModel.findOne({
            _id: id,
            userId: currentUserId,
            isActive: true,
        });
        if (!currentOwnerMember) {
            throw ErrorHelper.recoredNotFound("Workspace Member");
        }
        // Chỉ OWNER mới được chuyển quyền
        if (currentOwnerMember.role !== "OWNER") {
            throw ErrorHelper.permissionDeny("Chỉ chủ sở hữu mới có thể chuyển quyền sở hữu");
        }
        // Không cho chuyển cho chính mình
        if (currentUserId.toString() === newOwnerId.toString()) {
            throw ErrorHelper.requestDataInvalid("Không thể chuyển quyền cho chính mình");
        }
        // Tìm người được chuyển quyền trong cùng Workspace
        const newOwnerMember = await WorkspaceMemberModel.findOne({
            workspaceId: currentOwnerMember.workspaceId,
            userId: newOwnerId,
            isActive: true,
        });
        if (!newOwnerMember) {
            throw ErrorHelper.recoredNotFound("Người dùng không thuộc Workspace này");
        }
        // Owner cũ trở thành Editor
        currentOwnerMember.role = "VIEWER";
        // Editor mới trở thành Owner
        newOwnerMember.role = "OWNER";
        const workspace = await WorkspaceModel.findById(currentOwnerMember.workspaceId);
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        workspace.ownerId = newOwnerId;
        await workspace.save();
        await currentOwnerMember.save();
        await newOwnerMember.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Chuyển quyền sở hữu thành công",
            data: {
                currentOwner: currentOwnerMember,
                newOwner: newOwnerMember,
            },
        });
    }
    async getWorkspaceMembers(req, res) {
        const { workspaceId } = req.params;
        const currentUserId = req.tokenInfo._id;
        const currentMember = await WorkspaceMemberModel.findOne({
            workspaceId,
            userId: currentUserId,
            isActive: true,
        });
        if (!currentMember) {
            throw ErrorHelper.permissionDeny("Bạn không thuộc workspace này");
        }
        const members = await WorkspaceMemberModel.find({
            workspaceId,
            isActive: true,
        }).populate("userId", "-password -key");
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Lấy danh sách thành viên thành công",
            data: {
                members,
            },
        });
    }
    async removeWorkspaceMember(req, res) {
        const currentUserId = req.tokenInfo._id;
        const { id } = req.params;
        const currentOwner = await WorkspaceMemberModel.findOne({
            userId: currentUserId,
            role: "OWNER",
            isActive: true,
        });
        if (!currentOwner) {
            throw ErrorHelper.permissionDeny("Chỉ OWNER mới có quyền xóa thành viên");
        }
        const member = await WorkspaceMemberModel.findOne({
            _id: id,
            workspaceId: currentOwner.workspaceId,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.recoredNotFound("Workspace Member");
        }
        if (member.role === "OWNER") {
            throw ErrorHelper.permissionDeny("Không thể xóa OWNER");
        }
        member.isActive = false;
        await member.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Xóa thành viên khỏi workspace thành công",
            data: {
                member,
            },
        });
    }
    async updateWorkspaceMemberRole(req, res) {
        const currentUserId = req.tokenInfo._id;
        const { id } = req.params;
        const { role } = req.body;
        if (!["EDITOR", "VIEWER"].includes(role)) {
            throw ErrorHelper.requestDataInvalid("Role không hợp lệ");
        }
        const currentOwner = await WorkspaceMemberModel.findOne({
            userId: currentUserId,
            role: "OWNER",
            isActive: true,
        });
        if (!currentOwner) {
            throw ErrorHelper.permissionDeny("Chỉ OWNER mới có quyền thay đổi role");
        }
        const member = await WorkspaceMemberModel.findOne({
            _id: id,
            workspaceId: currentOwner.workspaceId,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.recoredNotFound("Workspace Member");
        }
        if (member.role === "OWNER") {
            throw ErrorHelper.permissionDeny("Không thể thay đổi role của OWNER");
        }
        member.role = role;
        await member.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Cập nhật quyền thành công",
            data: {
                member,
            },
        });
    }
}
export default new WorkspaceMemberRoute().router;
