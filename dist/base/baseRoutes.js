import express from "express";
import { resError } from "../helper/resError.js";
export class BaseRoute {
    router;
    constructor() {
        this.router = express.Router();
        this.customRouting();
    }
    route(func) {
        return async (req, res, next) => {
            try {
                await func.call(this, req, res, next);
            }
            catch (error) {
                this.resError(res, error);
            }
        };
    }
    resError(res, error) {
        return resError(res, error);
    }
}
