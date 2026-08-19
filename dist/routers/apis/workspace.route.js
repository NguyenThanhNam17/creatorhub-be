import { ErrorHelper } from "../../base/error.js";
import { BaseRoute, } from "../../base/baseRoutes.js";
import { WorkspaceModel } from "../../models/workspace/workspace.model.js";
import { WorkspaceMemberModel } from "../../models/workspaceMember/workspaceMember.model.js";
import { UserModel } from "../../models/user/user.model.js";
import { TokenHelper } from "../../helper/token.helper.js";
import { ROLES } from "../../constants/role.const.js";
class WorkspaceRoute extends BaseRoute {
    constructor() {
        super();
    }
    customRouting() {
        this.router.post("/archiveWorkspace", this.authentication, this.route(this.archiveWorkspace));
        this.router.post("/createWorkspace", this.authentication, this.route(this.createWorkspace));
        this.router.get("/listWorkspace", this.authentication, this.route(this.getListWorkspace));
        this.router.get("/detailWorkspace/:id", this.authentication, this.route(this.detailWorkspace));
        this.router.put("/updateWorkspace", this.authentication, this.route(this.updateWorkspace));
        this.router.post("/restoreWorkspace", this.authentication, this.route(this.restoreWorkspace));
        this.router.delete("/deleteWorkspace", this.authentication, this.route(this.deleteWorkspace));
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
                throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập Workspace này");
            }
        }
        catch {
            throw ErrorHelper.unauthorized();
        }
    }
    async archiveWorkspace(req, res) {
        const { workspaceId } = req.body;
        if (!workspaceId) {
            throw ErrorHelper.requestDataInvalid("workspaceId không được để trống");
        }
        // Tìm workspace
        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        const currentUserId = req.tokenInfo._id;
        // Lấy thông tin user thực hiện hành động để ghi log
        const user = await UserModel.findById(currentUserId);
        if (!user) {
            throw ErrorHelper.userNotExist();
        }
        // Kiểm tra quyền OWNER
        const isDirectOwner = workspace.ownerId &&
            workspace.ownerId.toString() === currentUserId.toString();
        const member = await WorkspaceMemberModel.findOne({
            workspaceId: workspace._id,
            userId: currentUserId,
            role: "OWNER",
        });
        if (!isDirectOwner && !member) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập Workspace này");
        }
        // Kiểm tra workspace mặc định
        if (workspace.isDefault) {
            throw ErrorHelper.requestDataInvalid("Không thể lưu trữ (archive) workspace mặc định.");
        }
        // Cập nhật trạng thái
        workspace.isActive = false;
        await workspace.save();
        // Ghi log người thực hiện
        console.log(`[WORKSPACE ARCHIVE] User ${user.username} (ID: ${user._id}) archived workspace ${workspace.name} (ID: ${workspace._id}) at ${new Date().toISOString()}`);
        // Response
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: { workspace },
        });
    }
    async createWorkspace(req, res) {
        const { name, description, category } = req.body;
        if (!name) {
            throw ErrorHelper.requestDataInvalid("Tên Workspace không được để trống");
        }
        const currentUserId = req.tokenInfo._id;
        // Kiểm tra trùng tên Workspace đối với cùng một owner
        const existingWorkspace = await WorkspaceModel.findOne({
            name: name.trim(),
            ownerId: currentUserId,
        });
        if (existingWorkspace) {
            throw ErrorHelper.requestDataInvalid("Tên Workspace đã tồn tại cho người dùng này");
        }
        // Khởi tạo Workspace mới
        const workspace = new WorkspaceModel({
            name: name.trim(),
            description,
            category,
            ownerId: currentUserId,
            isActive: true,
            isDefault: false,
        });
        await workspace.save();
        // Tự động tạo bản ghi WorkspaceMember cho OWNER
        const workspaceMember = new WorkspaceMemberModel({
            workspaceId: workspace._id,
            userId: currentUserId,
            role: "OWNER",
            joinedAt: new Date(),
            isActive: true,
        });
        await workspaceMember.save();
        // Response
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: { workspace },
        });
    }
    async getListWorkspace(req, res) {
        const currentUserId = req.tokenInfo._id;
        // Phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Tìm các workspace mà user là thành viên hoạt động
        const members = await WorkspaceMemberModel.find({
            userId: currentUserId,
            isActive: true,
        });
        const memberWorkspaceIds = members.map((m) => m.workspaceId);
        // Xây dựng câu truy vấn query
        const query = {
            $and: [
                { isActive: true }, // Không lấy các Workspace đã Archive
                {
                    $or: [
                        { ownerId: currentUserId },
                        { _id: { $in: memberWorkspaceIds } },
                    ],
                },
            ],
        };
        // Tìm kiếm theo tên
        if (req.query.search) {
            query.$and.push({
                name: { $regex: req.query.search, $options: "i" },
            });
        }
        // Lọc theo danh mục
        if (req.query.category) {
            query.$and.push({
                category: req.query.category,
            });
        }
        // Sắp xếp
        const sortDirection = req.query.sort === "asc" ? 1 : -1;
        const sort = { createdAt: sortDirection };
        // Đếm tổng số bản ghi và truy vấn dữ liệu
        const total = await WorkspaceModel.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const workspaces = await WorkspaceModel.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        // Response
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: {
                workspaces,
                pagination: {
                    total,
                    totalPages,
                    page,
                    limit,
                },
            },
        });
    }
    async detailWorkspace(req, res) {
         let { id } = req.params;
        if (!id) {
            throw ErrorHelper.requestDataInvalid("workspaceId không được để trống");
        }
        // Tìm Workspace
        const workspace = await WorkspaceModel.findById(id).populate("ownerId", "workspaceMember", "workspaceRole");
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        const currentUserId = req.tokenInfo._id;
        // Kiểm tra xem người dùng có quyền truy cập không (là owner hoặc là member)
        const isOwner = workspace.ownerId &&
            workspace.ownerId.toString() === currentUserId.toString();
        const memberRecord = await WorkspaceMemberModel.findOne({
            workspaceId: workspace._id,
            userId: currentUserId,
            isActive: true,
        });
        if (!isOwner && !memberRecord) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập Workspace này");
        }
        // Lấy thông tin Owner
        const owner = await UserModel.findById(workspace.ownerId).select("-password -key");
        // Lấy danh sách Member hoạt động và populate thông tin User
        const members = await WorkspaceMemberModel.find({
            workspaceId: workspace._id,
            isActive: true,
        }).populate("userId", "-password -key");
        // Phản hồi kết quả
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: {
                workspace,
                owner,
                members,
                totalMembers: members.length,
            },
        });
    }
    async updateWorkspace(req, res) {
        const { workspaceId, name, description, category } = req.body;
        if (!workspaceId) {
            throw ErrorHelper.requestDataInvalid("workspaceId không được để trống");
        }
        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        const currentUserId = req.tokenInfo._id;
        // Kiểm tra OWNER
        const isOwner = workspace.ownerId &&
            workspace.ownerId.toString() === currentUserId.toString();
        const ownerMember = await WorkspaceMemberModel.findOne({
            workspaceId: workspace._id,
            userId: currentUserId,
            role: "OWNER",
            isActive: true,
        });
        if (!isOwner && !ownerMember) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập Workspace này");
        }
        // Không cho đổi tên trùng
        if (name && name.trim() !== workspace.name) {
            const existed = await WorkspaceModel.findOne({
                _id: { $ne: workspace._id },
                ownerId: currentUserId,
                name: name.trim(),
            });
            if (existed) {
                throw ErrorHelper.requestDataInvalid("Tên Workspace đã tồn tại");
            }
            workspace.name = name.trim();
        }
        if (description !== undefined) {
            workspace.description = description;
        }
        if (category !== undefined) {
            workspace.category = category;
        }
        workspace.updatedAt = new Date();
        await workspace.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: {
                workspace,
            },
        });
    }
    async restoreWorkspace(req, res) {
        const { workspaceId } = req.body;
        if (!workspaceId) {
            throw ErrorHelper.requestDataInvalid("workspaceId không được để trống");
        }
        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        const currentUserId = req.tokenInfo._id;
        const isOwner = workspace.ownerId &&
            workspace.ownerId.toString() === currentUserId.toString();
        const ownerMember = await WorkspaceMemberModel.findOne({
            workspaceId: workspace._id,
            userId: currentUserId,
            role: "OWNER",
            isActive: true,
        });
        if (!isOwner && !ownerMember) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập Workspace này");
        }
        if (workspace.isActive) {
            throw ErrorHelper.requestDataInvalid("Workspace đang hoạt động.");
        }
        const existed = await WorkspaceModel.findOne({
            _id: { $ne: workspace._id },
            ownerId: currentUserId,
            name: workspace.name,
            isActive: true,
        });
        if (existed) {
            throw ErrorHelper.requestDataInvalid("Tên Workspace đã tồn tại.");
        }
        workspace.isActive = true;
        await workspace.save();
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "success",
            data: {
                workspace,
            },
        });
    }
    async deleteWorkspace(req, res) {
        const { workspaceId } = req.body;
        if (!workspaceId) {
            throw ErrorHelper.requestDataInvalid("workspaceId không được để trống");
        }
        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            throw ErrorHelper.recoredNotFound("Workspace");
        }
        const currentUserId = req.tokenInfo._id;
        const isOwner = workspace.ownerId &&
            workspace.ownerId.toString() === currentUserId.toString();
        const ownerMember = await WorkspaceMemberModel.findOne({
            workspaceId: workspace._id,
            userId: currentUserId,
            role: "OWNER",
            isActive: true,
        });
        if (!isOwner && !ownerMember) {
            throw ErrorHelper.permissionDeny("Bạn không có quyền truy cập Workspace này");
        }
        if (workspace.isActive) {
            throw ErrorHelper.requestDataInvalid("Chỉ được xóa Workspace đã Archive.");
        }
        await WorkspaceMemberModel.deleteMany({
            workspaceId: workspace._id,
        });
        await WorkspaceModel.deleteOne({
            _id: workspace._id,
        });
        return res.status(200).json({
            status: 200,
            code: "200",
            message: "Workspace deleted successfully.",
        });
    }
}
export default new WorkspaceRoute().router;
