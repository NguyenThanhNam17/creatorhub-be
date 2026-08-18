import { ErrorHelper } from "../../base/error.js";
import {
  BaseRoute,
  Request,
  Response,
  NextFunction,
} from "../../base/baseRoutes.js";
import { TokenHelper } from "../../helper/token.helper.js";
import { ROLES } from "../../constants/role.const.js";
import { UserModel } from "../../models/user/user.model.js";
import { WorkspaceInvitationModel } from "../../models/workspaceInvitation/workspaceInvitation.model.js";
import { WorkspaceMemberModel } from "../../models/workspaceMember/workspaceMember.model.js";
import { ROLESMODEL, STATUS } from "../../constants/model.const.js";

class WorkspaceInvitationRoute extends BaseRoute {
  constructor() {
    super();
  }

  customRouting() {
    this.router.post(
      "/inviteUserToWorkspace",
      this.authentication,
      this.route(this.inviteUserToWorkspace),
    );
    this.router.get(
      "/getMyWorkspaceInvitations",
      this.authentication,
      this.route(this.getMyWorkspaceInvitations),
    );
    this.router.post(
      "/acceptWorkspaceInvitation/:id",
      this.authentication,
      this.route(this.acceptWorkspaceInvitation),
    );
    this.router.post(
      "/rejectWorkspaceInvitation/:id",
      this.authentication,
      this.route(this.rejectWorkspaceInvitation),
    );
    this.router.post(
      "/cancelWorkspaceInvitation/:id",
      this.authentication,
      this.route(this.cancelWorkspaceInvitation),
    );
  }

  async authentication(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.get("x-token")) {
        throw ErrorHelper.unauthorized();
      }
      const tokenData: any = TokenHelper.decodeToken(req.get("x-token")!);
      if (ROLES.ALL.includes(tokenData.role_)) {
        const user: any = await UserModel.findById(tokenData._id);
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
      } else {
        throw ErrorHelper.permissionDeny(
          "Bạn không có quyền thực hiện hành động này",
        );
      }
    } catch {
      throw ErrorHelper.unauthorized();
    }
  }

  async inviteUserToWorkspace(req: Request, res: Response) {
    const { workspaceId, invitedUserId } = req.body;

    if (!workspaceId || !invitedUserId) {
      throw ErrorHelper.requestDataInvalid(
        "workspaceId và invitedUserId là bắt buộc",
      );
    }

    const invitedUser = await UserModel.findById(invitedUserId);

    if (!invitedUser) {
      throw ErrorHelper.userNotExist();
    }
    if (String(invitedUserId) == String(req.tokenInfo!._id)) {
      throw ErrorHelper.forbidden("Không thể tự mời chính mình");
    }

    // Kiểm tra người gọi có phải OWNER không
    const currentMember = await WorkspaceMemberModel.findOne({
      workspaceId,
      userId: req.tokenInfo!._id,
      role: ROLESMODEL.OWNER,
      isActive: true,
    });

    if (!currentMember) {
      throw ErrorHelper.permissionDeny("Chỉ OWNER mới có thể mời thành viên");
    }

    // Kiểm tra User đã là thành viên chưa
    const existingMember = await WorkspaceMemberModel.findOne({
      workspaceId,
      userId: invitedUserId,
      isActive: true,
    });

    if (existingMember) {
      throw ErrorHelper.forbidden("Người dùng đã là thành viên của workspace");
    }

    // Chỉ chặn invitation đang chờ xử lý
    const existingInvitation = await WorkspaceInvitationModel.findOne({
      workspaceId,
      invitedUserId,
      status: STATUS.PENDING,
    });

    if (existingInvitation) {
      throw ErrorHelper.forbidden("Người dùng đã có lời mời đang chờ xử lý");
    }

    const newInvitation = new WorkspaceInvitationModel({
      workspaceId,
      invitedUserId,
      invitedByUserId: req.tokenInfo!._id,
      role: ROLESMODEL.EDITOR,
      status: STATUS.PENDING,
    });

    await newInvitation.save();

    return res.status(200).json({
      status: 200,
      code: "200",
      message: "Mời người dùng vào workspace thành công",
      data: {
        newInvitation,
      },
    });
  }

  async getMyWorkspaceInvitations(req: Request, res: Response) {
    let invitations = await WorkspaceInvitationModel.find({
      invitedUserId: req.tokenInfo?._id,
      status: STATUS.PENDING,
    });
    return res.status(200).json({
      status: 200,
      code: 200,
      message: "Lấy lời mời workspace thành công",
      data: { invitations },
    });
  }

  async acceptWorkspaceInvitation(req: Request, res: Response) {
    const { id: invitationId } = req.params;
    let invitation = await WorkspaceInvitationModel.findById(invitationId);
    if (!invitation) {
      throw ErrorHelper.forbidden("Lời mời không tồn tại");
    }
    if (String(invitation.invitedUserId) !== String(req.tokenInfo!._id)) {
      throw ErrorHelper.permissionDeny("Bạn không có quyền xử lý lời mời này");
    }
    if (invitation.status !== STATUS.PENDING) {
      throw ErrorHelper.forbidden("Lời mời đã được xử lý");
    }

    let newMember = new WorkspaceMemberModel({
      workspaceId: invitation.workspaceId,
      userId: invitation.invitedUserId,
      role: invitation.role,
      isActive: true,
    });
    await newMember.save();
    invitation.status = STATUS.ACCEPTED;
    await invitation.save();
    return res.status(200).json({
      status: 200,
      code: 200,
      message: "Chấp nhận lời mời workspace thành công",
      data: { newMember },
    });
  }

  async rejectWorkspaceInvitation(req: Request, res: Response) {
    const { id: invitationId } = req.params;
    let invitation = await WorkspaceInvitationModel.findById(invitationId);
    if (!invitation) {
      throw ErrorHelper.forbidden("Lời mời không tồn tại");
    }
    if (String(invitation.invitedUserId) !== String(req.tokenInfo!._id)) {
      throw ErrorHelper.permissionDeny("Bạn không có quyền xử lý lời mời này");
    }
    if (invitation.status !== STATUS.PENDING) {
      throw ErrorHelper.forbidden("Lời mời đã được xử lý");
    }
    invitation.status = STATUS.REJECTED;
    await invitation.save();
    return res.status(200).json({
      status: 200,
      code: 200,
      message: "Từ chối lời mời workspace thành công",
      data: { invitation },
    });
  }

  async cancelWorkspaceInvitation(req: Request, res: Response) {
    const { id: invitationId } = req.params;
    let invitation = await WorkspaceInvitationModel.findById(invitationId);
    if (!invitation) {
      throw ErrorHelper.forbidden("Lời mời không tồn tại");
    }
    let currentMember = await WorkspaceMemberModel.findOne({
      workspaceId: invitation.workspaceId,
      userId: req.tokenInfo?._id,
      role: ROLESMODEL.OWNER,
      isActive: true,
    });
    if (!currentMember) {
      throw ErrorHelper.forbidden("Bạn không phải là chủ sở hữu workspace");
    }
    if (invitation.status !== STATUS.PENDING) {
      throw ErrorHelper.forbidden("Lời mời đã được xử lý");
    }
    invitation.status = STATUS.CANCELLED;
    await invitation.save();
    return res.status(200).json({
      status: 200,
      code: 200,
      message: "Hủy lời mời workspace thành công",
      data: { invitation },
    });
  }
}
export default new WorkspaceInvitationRoute().router;
