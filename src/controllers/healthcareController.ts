import MomentTimezone from "../helpers/timezone";
import PatientService from "../services/patientService";
import validateReqBody, { ReqBody } from "../utils/requestbody";
import { ApiStatus, ApiStatusCode, Role} from "../utils/enum";
import mongoose from "mongoose";
import Validate from "../utils/validate";
import Convert from "../utils/convert";
import SecurityService from "../services/securityService";
import UserService from "../services/userService";
import HealthService from "../services/healthService";
import appointmentScheduleService from "../services/appointmentScheduleService";

export default class HealthcareController {
    //POST 
    public static registerPatient = async (req, res, next) => {
      const session = await mongoose.startSession();
      session.startTransaction();
        try {
            validateReqBody(req, ReqBody.registerPatient, next);
            if (req.body.userId) {
              const patient = await PatientService.findByUserId(req.body.userId)
              if(patient) {
                await appointmentScheduleService.createWhenRegister(patient._id, req.body.initialSymptom, req.body.typeAppointment, req.body.departmentId, session )
                res.status(ApiStatusCode.OK).json({
                  status: ApiStatus.succes,
                  message: 'Dang ky kham benh thanh cong'
                });
              } else {
                res.status(ApiStatusCode.BadRequest).json({
                  status: ApiStatus.fail,
                  message: 'Khong tim thay benh nhan nao'
                });
              }
            } else {
              Validate.validateDob(req.body.dateOfBirth, next);
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
              const newUser = await UserService.createUser(objUser,session);
              const objPatient = {
                userId: newUser._id,
                insurance: req.body.insurance,
                hospitalization: 1,
              }
              const { _id } = await PatientService.createPatient(objPatient, session);
              await HealthService.createDefault(_id, session);
              await appointmentScheduleService.createWhenRegister(_id, req.body.initialSymptom, req.body.typeAppointment, req.body.departmentId, session )
              const objSecurity = {
                userId: newUser._id,
                username,
                password,
                role: Role.patient,
              }
              await SecurityService.registerCreateSecurity(objSecurity, session);
              await session.commitTransaction();
              session.endSession();
              res.status(ApiStatusCode.OK).json({
                  status: ApiStatus.succes,
                  data: { 
                      fullname: newUser.fullname,
                      username, 
                      password
                  },
                  message: 'Dang ky kham benh thanh cong'
              });
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            next(error)
        }
    }
    // POST
    public static searchPatientByInsurance = async (req, res, next) => {
        try {
            validateReqBody(req, ReqBody.searchPatientByInsurance, next);
            const patients = await PatientService.findOneByInsuranceToRegister(req.body.insurance);
            const result = patients.map(patient => {
                const user = patient.userId as any;
                return {
                    ...patient.userId,
                    dateOfBirth: MomentTimezone.convertDDMMYYY(user.dateOfBirth)
                }
            })
            res.status(ApiStatusCode.OK).json({
                status: ApiStatus.succes,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    //POST
    public static getPatientByUserId = async (req, res, next) => {
        try {
            validateReqBody(req, ReqBody.getPatientByUserId, next);
            const patient = await PatientService.getInfoByUserId(req.body.userId);
            res.status(ApiStatusCode.OK).json({
                status: ApiStatus.succes,
                data: patient
            });
        } catch (error) {
            next(error)
        }
    }
    //POST

}