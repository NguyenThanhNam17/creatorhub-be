import { TokenHelper } from "../../helper/token.helper.js";
export class UserHelper {
    user;
    constructor(user) {
        this.user = user;
    }
    value() {
        return this.user;
    }
    getToken(key) {
        return TokenHelper.generateToken({
            _id: this.user._id,
            role_: this.user.role,
            key: key ?? "",
        });
    }
}
