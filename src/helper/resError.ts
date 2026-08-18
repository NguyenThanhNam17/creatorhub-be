import { Response } from "express";

export function resError(res: Response, error: any){
    if(!error.info){
         res.status(500).json({
            status:500,
            code:"500",
            message:"đã có lỗi xảy ra",
        })
        logUnknowError(error);
    }
    else{
         res.status(error.info.status).json(error.info);
    }
}

function logUnknowError(error: Error){
    console.log("*** UNKNOW ERROR ***");
    console.log(error);
    console.log("********************");
}