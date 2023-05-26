import mongoose from "mongoose";
import MomentTimezone from "../helpers/timezone";
import { ApiStatus, ApiStatusCode } from "../models/Data/apiStatus";
import ReqBody from "../models/Data/reqBody";
import { Role } from "../models/Data/schema";
import DoctorService from "../services/doctorService";
import SecurityService from "../services/securityService";
import UserService from "../services/userService";
import Convert from "../utils/convert";
import Message from "../utils/message";
import validateReqBody from "../utils/validateReqBody";
import Validate from "../utils/validate";

export default class DoctorController {
      //POST 
      public static registerDoctor = async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            validateReqBody(req, ReqBody.registerDoctor, next);
            if(!Validate.dateOfBirth(req.body.dateOfBirth)) {
              const err: any = new Error(Message.invalidDateOfBirth);
              err.statusCode = ApiStatusCode.BadRequest;
              return next(err)
            }
            const username = Convert.generateUsername(req.body.fullname, req.body.dateOfBirth, await SecurityService.getAllUserName());
            const password = Convert.generatePassword(req.body.fullname);
            const objUser = {
                email: req.body.email,
                fullname: req.body.fullname,
                phonenumber: req.body.phonenumber,
                gender: req.body.gender,
                dateOfBirth: new Date(req.body.dateOfBirth),
                address: req.body.address,
                identification: req.body.identification
            };
            const newUser = await UserService.createUser(objUser, session);
            const objDoctor = {
              userId: newUser._id,
              department: req.body.department,
              rank: req.body.rank,
              position: req.body.position
            };
            await DoctorService.createDoctor(objDoctor, session);
            const objSecurity = {
              userId: newUser._id,
              username,
              password,
              role: Role.doctor,
            }
            await SecurityService.registerCreateSecurity(objSecurity, session);

            await session.commitTransaction();
            session.endSession();

            res.status(ApiStatusCode.OK).json({
                status: ApiStatus.succes,
                data: { 
                    fullname: newUser.fullname,
                    username: newUser.username, 
                    password: password
                }
            });
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          next(error)
        }
    }
  // GET
  public static getAllDoctor = async (req, res, next) => {
      try {
          const result = await DoctorService.getAll();
          const response = result.map(e => {
            const { dateOfBirth } = e.userId as any;
            const { name } = e.department as any;
            return {
              position: e.position,
              rank: e.rank,
              ...e.userId,
              department: name,
              dateOfBirth: MomentTimezone.convertDDMMYYY(dateOfBirth)
            }
          })
          res.status(ApiStatusCode.OK).json({
              status: ApiStatus.succes,
              data: response
          });
      } catch (error) {
          next(error);
      }
  }
}