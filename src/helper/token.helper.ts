import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
let secretKey: any = process.env.SECRET;
export interface IPayloadToken {
  role_?: string;
  _id?: any;
  username?: string;
  key?: string;
  email?: string;

  [name: string]: any;
}

export class TokenHelper {
  constructor() {}
  static generateToken(payload: IPayloadToken): string {
    return jwt.sign(payload, secretKey, { expiresIn: "30d" });
    // return jwt.sign(payload, configs.secretKey);
  }

  static decodeToken(token: string) {
    return jwt.verify(token, secretKey);
  }

  static generateKey() {
    const length = 7;
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
