import { TokenHelper } from "../../helper/token.helper.js";
import { IUser } from "./user.model.js";

export class UserHelper {
  constructor(private user: IUser) {}
  value() {
    return this.user;
  }
  getToken(key?: string) {
    return TokenHelper.generateToken({
      _id: this.user._id,
      role_:this.user.role,
      key: key ?? "",
    });
  }
}
