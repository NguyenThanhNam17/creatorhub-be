import { ErrorHelper } from "../../base/error.js";
import { ROLES } from "../../constants/role.const.js";
import { TokenHelper } from "../../helper/token.helper.js";
import { UserModel } from "../../models/user/user.model.js";
import { BaseRoute, } from "../../base/baseRoutes.js";
import { WorkspaceModel } from "../../models/workspace/workspace.model.js";
import { ContentModel } from "../../models/content/content.model.js";
import { WorkspaceMemberModel } from "../../models/workspaceMember/workspaceMember.model.js";
import { CONTENT_STATUS } from "../../constants/model.const.js";
class ContentRoute extends BaseRoute {
    constructor() {
        super();
    }
    customRouting() {
        this.router.get("/getListContent/:id", this.authentication, this.route(this.getListContent));
        this.router.get("/getOneContent/:id", this.authentication, this.route(this.getOneContent));
        this.router.post("/createContent", this.authentication, this.route(this.createContent));
        this.router.post("/deleteContent/:id", this.authentication, this.route(this.deleteContent));
        this.router.post("/updateContent/:id", this.authentication, this.route(this.updateContent));
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
    async getListContent(req, res) {
        let { id } = req.params;
        let workspace = await WorkspaceModel.findById(id);
        if (!workspace) {
            throw ErrorHelper.forbidden("Workspace không tồn tại");
        }
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        let member = await WorkspaceMemberModel.findOne({
            workspaceId: id,
            userId: req.tokenInfo._id,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.forbidden("Bạn không phải là thành viên của workspace này");
        }
        let listContent = await ContentModel.find({ workspaceId: id })
            .skip(skip)
            .limit(limit);
        const total = await ContentModel.countDocuments({ workspaceId: id });
        return res.json({
            status: 200,
            code: 200,
            message: "Lấy danh sách content thành công",
            data: {
                contents: listContent,
                total,
                page,
                limit,
            },
        });
    }
    async getOneContent(req, res) {
        let { id } = req.params;
        let content = await ContentModel.findById(id);
        if (!content) {
            throw ErrorHelper.forbidden("Content không tồn tại");
        }
        let workspace = await WorkspaceModel.findById(content.workspaceId);
        if (!workspace) {
            throw ErrorHelper.forbidden("Workspace không tồn tại");
        }
        let member = await WorkspaceMemberModel.findOne({
            workspaceId: content.workspaceId,
            userId: req.tokenInfo._id,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.forbidden("Bạn không phải là thành viên của workspace này");
        }
        return res.json({
            status: 200,
            code: 200,
            message: "Lấy thông tin content thành công",
            data: content,
        });
    }
    async createContent(req, res) {
        let { title, description, thumbnailUrl, workspaceId, assignedTo } = req.body;
        let workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            throw ErrorHelper.forbidden("Workspace không tồn tại");
        }
        let member = await WorkspaceMemberModel.findOne({
            workspaceId,
            userId: req.tokenInfo._id,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.forbidden("Bạn không phải là thành viên của workspace này");
        }
        if (assignedTo) {
            const member = await WorkspaceMemberModel.findOne({
                workspaceId,
                userId: assignedTo,
                isActive: true,
            });
            if (!member) {
                throw ErrorHelper.forbidden("Người được giao không thuộc workspace");
            }
        }
        let content = new ContentModel({
            title,
            description,
            status: CONTENT_STATUS.IDEA,
            thumbnailUrl,
            workspaceId,
            createdBy: req.tokenInfo._id,
            assignedTo,
        });
        await content.save();
        return res.json({
            status: 200,
            code: 200,
            message: "Tạo content thành công",
            data: content,
        });
    }
    async deleteContent(req, res) {
        let { id } = req.params;
        let content = await ContentModel.findById(id);
        if (!content) {
            throw ErrorHelper.forbidden("Content không tồn tại");
        }
        let workspace = await WorkspaceModel.findById(content.workspaceId);
        if (!workspace) {
            throw ErrorHelper.forbidden("Workspace không tồn tại");
        }
        let member = await WorkspaceMemberModel.findOne({
            workspaceId: content.workspaceId,
            userId: req.tokenInfo._id,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.forbidden("Bạn không phải là thành viên của workspace này");
        }
        await content.deleteOne();
        return res.json({
            status: 200,
            code: 200,
            message: "Xóa content thành công",
        });
    }
    async updateContent(req, res) {
        let { id } = req.params;
        let { title, description, status, thumbnailUrl, assignedTo } = req.body;
        const currentUserId = req.tokenInfo._id;
        let content = await ContentModel.findById(id);
        if (!content) {
            throw ErrorHelper.forbidden("Content không tồn tại");
        }
        let workspace = await WorkspaceModel.findById(content?.workspaceId);
        if (!workspace) {
            throw ErrorHelper.forbidden("Workspace không tồn tại");
        }
        let member = await WorkspaceMemberModel.findOne({
            workspaceId: content?.workspaceId,
            userId: req.tokenInfo._id,
            isActive: true,
        });
        if (!member) {
            throw ErrorHelper.forbidden("Bạn không phải là thành viên của workspace này");
        }
        let updateBy = await UserModel.findById(currentUserId);
        if (!updateBy) {
            throw ErrorHelper.forbidden("Người cập nhật không tồn tại");
        }
        const validStatuses = Object.values(CONTENT_STATUS);
        if (status && !validStatuses.includes(status)) {
            throw ErrorHelper.forbidden("Status không hợp lệ");
        }
        content.title = title;
        content.description = description;
        content.status = status;
        content.thumbnailUrl = thumbnailUrl;
        content.assignedTo = assignedTo;
        content.updateBy = updateBy.username.toString();
        await content.save();
        return res.json({
            status: 200,
            code: 200,
            message: "Cập nhật content thành công",
            data: { content },
        });
    }
}
export default new ContentRoute().router;
