import express, { RequestHandler } from "express";
import { resError } from "../helper/resError.js";
import { ROLES } from "../constants/role.const.js";

export interface Request extends express.Request {
  tokenInfo?: {
    role_: keyof typeof ROLES;
    _id: string;
    key: string;
    [name: string]: any;
  };
  files?: any;
}

export interface Response extends express.Response {}
export interface NextFunction extends express.NextFunction {}

export abstract class BaseRoute {
  router: express.Router;

  constructor() {
    this.router = express.Router();
    this.customRouting();
  }

  abstract customRouting(): void;

  route(
    func: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<any>
  ): RequestHandler {
    return async (req, res, next) => {
      try {
        await func.call(
          this,
          req as Request,
          res as Response,
          next as NextFunction
        );
      } catch (error) {
        this.resError(res as Response, error);
      }
    };
  }

  resError(res: Response, error: any) {
    return resError(res, error);
  }
}