import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
let secretKey = process.env.SECRET;
export class TokenHelper {
    constructor() { }
    static generateToken(payload) {
        return jwt.sign(payload, secretKey, { expiresIn: "30d" });
        // return jwt.sign(payload, configs.secretKey);
    }
    static decodeToken(token) {
        return jwt.verify(token, secretKey);
    }
    static generateKey() {
        const length = 7;
        var result = "";
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
