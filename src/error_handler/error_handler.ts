import { type Response,type Request,type NextFunction } from "express";

export class app_error extends Error{
   statusCode:number;
   constructor(message:string,statusCode:number){
    super(message);
    this.statusCode=statusCode;
    Error.captureStackTrace(this,this.constructor);
   }
}
    

export const error_handler = (err:app_error,req:Request,res:Response,next:NextFunction)=>{
    console.log(err.stack);
    res.status(err.statusCode || 500).json({success:false,message:err.message || "internal server error"})
}