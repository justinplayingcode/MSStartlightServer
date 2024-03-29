import MomentTimezone from "../helpers/timezone";
import PatientService from "../services/patientService";
import validateReqBody, { ReqBody } from "../utils/requestbody";
import { ApiStatus, ApiStatusCode, Onboarding, Role, TableType } from "../utils/enum";
import mongoose from "mongoose";
import Validate from "../utils/validate";
import Convert from "../utils/convert";
import SecurityService from "../services/securityService";
import UserService from "../services/userService";
import HealthService from "../services/healthService";
import appointmentScheduleService from "../services/appointmentScheduleService";
import { TableResponseNoData, schemaFields } from "../utils/constant";
import DoctorService from "../services/doctorService";
import HistoriesService from "../services/historiesService";
import testService from "../services/testService";
import historiesService from "../services/historiesService";
import billService from "../services/billService";
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
                const newAppointment = await appointmentScheduleService.createWhenRegister(patient._id, req.body.initialSymptom, req.body.typeAppointment, req.body.departmentId, session );
                await HistoriesService.createNew(newAppointment._id, 1, session);
                await session.commitTransaction();
                session.endSession();
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
              };
              const { _id } = await PatientService.createPatient(objPatient, session);
              await HealthService.createDefault(_id, session);
              const newAppointment = await appointmentScheduleService.createWhenRegister(_id, req.body.initialSymptom, req.body.typeAppointment, req.body.departmentId, session )
              //create history
              await HistoriesService.createNew(newAppointment._id, 1, session);
              const objSecurity = {
                userId: newUser._id,
                username,
                password,
                role: Role.patient,
              };
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
    public static getListPatientOnBoarding = async (req, res, next) => {
      try {
        const { userId } = req.user;
        validateReqBody(req, ReqBody.getTableValues, next);
        const doctor = await DoctorService.getInforByUserId(userId);
        if(!doctor) {
          const err: any = new Error("Không tòn tại bác sĩ");
          err.statusCode = ApiStatusCode.BadRequest;
          return next(err)
        }
        let data;
        switch(req.body.tableType) {
          case TableType.schedulePatientIn:
            data = await PatientService.getAllPatientOnBoarding(req.body.page, req.body.pageSize, req.body.searchKey, doctor.departmentId, Onboarding.inpatient);
            break;
          case TableType.schedulePatientOut:
            data = await PatientService.getAllPatientOnBoarding(req.body.page, req.body.pageSize, req.body.searchKey, doctor.departmentId, Onboarding.outpatient);
            break;
          default:
            data = TableResponseNoData;
        }
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data: data
        })
      } catch (error) {
        next(error)
      }
    }

    //POST
    public static getHistoryMedical = async (req, res, next) => {
      try {
        const { userId } = req.user;
        validateReqBody(req, ReqBody.getTableValues, next);
        const user = await UserService.findById(userId);
        if(!user) {
          const err: any = new Error("Không tòn tại người dùng");
          err.statusCode = ApiStatusCode.BadRequest;
          return next(err)
        }
        let data;
        switch(req.body.tableType) {
          case TableType.historyMedicalOfPatient:
            const patient = await PatientService.findByUserId(userId);
            data = await HistoriesService.getHistoryMedicalOfPatient(req.body.page, req.body.pageSize, req.body.searchKey, patient._id);
            break;
          case TableType.historyMedicalOfDoctor:
            const doctor = await DoctorService.getInforByUserId(userId);
            data = await HistoriesService.getHistoryMedicalOfDoctor(req.body.page, req.body.pageSize, req.body.searchKey, doctor._id);
            break;
          default:
            data = TableResponseNoData;
        }
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data: data
        })
      } catch (error) {
        next(error)
      }
    }

    //GET
    public static getHistoryMedicalDetails =async (req, res, next) => {
      try {
        const { role } = req.user;
        let data;
        switch(role) {
          case Role.doctor:
            data = await historiesService.getHistoryMedicalDetails(req.query.id, true)
            break;
          case Role.patient:
            data = await historiesService.getHistoryMedicalDetails(req.query.id, false)
            break;
        }
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data: data
        })
      } catch (error) {
        next(error)
      }
    }

    //GET
    public static getListTestService = async (req, res, next) => {
      try {
        const tests = await testService.getListTestService();
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data: tests
        })
      } catch (error) {
        next(error)
      }
    }

    //POST 
    public static createTestService = async (req, res, next) => {
      try {
        validateReqBody(req, ReqBody.createTestService, next);
        await testService.createTestservice(req.body.service, req.body.price);
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data: 'successful'
        })
      } catch (error) {
        next(error)
      }
    }

    //GET
    public static getDetailsPatientWithHistory = async (req, res, next) => {
      try {
        const patientId = req.query.id;
        const infoUser = PatientService.getInfoById(patientId);
        const healthIndicator = HealthService.findOneByPatientId(patientId);
        const schedules = appointmentScheduleService.getScheduleNearestOfPatient(patientId);
        
        let data;
        const result = await Promise.all([infoUser, healthIndicator, schedules]);
        data = {
          ...result[0],
          ...result[1],
          schedules: result[2]
        }
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data: data
        })
      } catch (error) {
        next(error)
      }
    }

    //GET
    public static getPill = async (req, res, next) => {
      try {
        const history = await historiesService.findOneByKey(schemaFields.appointmentScheduleId, req.query.id);
        const bill = await billService.findByHistoryId(history._id);
        res.status(ApiStatusCode.OK).json({
          status: ApiStatus.succes,
          data : bill
        });
      } catch (error) {
        next(error)
      }
    }

    
}