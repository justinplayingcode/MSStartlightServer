import { ClientSession } from "mongoose";
import { ICreatePatient } from "../models/Patient";
import Patient from "../schema/Patient"
import { schemaFields } from "../utils/constant";
import MomentTimezone from "../helpers/timezone";
import Boarding from "../schema/Boarding";
import Convert from "../utils/convert";
import { MappingGender } from "../models/common";

export default class PatientService {
  public static totalCount = async () => {
    return await Patient.countDocuments();
  }

  public static createPatient = async (obj: ICreatePatient, session: ClientSession) => {
    try {
      const patient = new Patient(obj);
      return await patient.save({ session });
    } catch (error) {
      throw error;
    }
  }

  public static getAll = async (page: number, pageSize: number, searchKey: string) => {
    const patients = await (await Patient.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(`-__v`)
      .populate({
        path: schemaFields.userId,
        select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
        match: {
          fullname: { $regex: new RegExp(searchKey, 'i') }
        }
      })
      .lean())?.reduce((acc, cur) => {
        if(cur.userId) {
          const { dateOfBirth, _id, ...userInfo } = cur.userId as any;
          acc.push({
                ...userInfo,
                userId: _id,
                dateOfBirth: MomentTimezone.convertDDMMYYY(dateOfBirth),
                insurance: cur.insurance,
                hospitalization: cur.hospitalization
              })
        }
        return acc
      }, []);

    const totalPatients = await (await Patient.find()
      .populate({
        path: schemaFields.userId,
        select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
        match: {
          fullname: { $regex: new RegExp(searchKey, 'i') }
        }
      })
      .lean())?.reduce((acc, cur) => {
        if(cur.userId) {
          acc.push(cur)
        }
        return acc
      }, [])

    return {
      values: patients,
      total: totalPatients.length
    };

  }

  public static findOneByInsuranceToRegister = async (insurance: string) => {
    return await Patient.find({ insurance }).populate({
        path: schemaFields.userId,
        select: `${schemaFields.fullname} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields.phonenumber}`
    }).lean();
  }

  public static findByUserId = async (userId) => {
    return await Patient.findOne({ userId })
      .select(`-__v`)
      .lean();
  }

  public static getInfoByUserId = async (id) => {
    const { _id, userId, ...info} = await Patient.findOne({ userId: id})
      .populate({
        path: schemaFields.userId,
        select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification} -${schemaFields._id}`
      })
      .select(`-__v`)
      .lean();

    const respone = {
      patientId: _id,
      ...userId,
      ...info
    }

    return respone;
  }

  public static findOneById = async (id) => {
    return await Patient.findById(id).lean();
  }

  public static getAllPatientOnBoarding = async (page: number, pageSize: number, searchKey: string, departmentId, boardingStatus) => {
    const patients = await Boarding.find({ departmentId, boardingStatus: boardingStatus })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(`-__v`)
      .populate({
        path: schemaFields.patientId,
        populate: ({
          path: schemaFields.userId,
          select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
            match: {
              fullname: { $regex: new RegExp(searchKey, 'i') }
            }
        })
      })
      .populate({ path: schemaFields.departmentId, select: `${schemaFields.departmentName}` })
      .lean();

    const values = patients.reduce((acc, cur) => {
      const { _id: departmentId, departmentName} = cur.departmentId as any;
      const { _id: patientId, userId: userIdOfPatient, insurance } = cur.patientId as any;
      const { _id: userId, dateOfBirth, ...info } = userIdOfPatient as any;
      acc.push({
        _id: cur._id,
        onBoardingDate: MomentTimezone.convertDDMMYYY(cur.onBoardingDate),
        departmentId,
        departmentName,
        patientId,
        insurance,
        userId,
        dateOfBirth: MomentTimezone.convertDDMMYYY(dateOfBirth),
        ...info
      })
      return acc
    }, [])
    const totals = await Boarding.find({ departmentId, boardingStatus: boardingStatus }).countDocuments()
    return {
      values: values,
      total: totals
    }
  }

  public static getInfoById = async (id) => {
    const { _id, userId, ...info} = await Patient.findOne({ _id: id })
      .populate({
        path: schemaFields.userId,
        select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification} -${schemaFields._id}`
      })
      .select(`-__v`)
      .lean();

    const respone = {
      patientId: _id,
      ...userId,
      ...info
    }

    return respone;
  }

  public static getAllCsv = async () => {
    const doctors = await Patient.find({})
        .select(`-__v -${schemaFields.isActive}`)
        .populate({
          path: schemaFields.userId,
          select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
        })
        .lean();
      const response = doctors.reduce((acc, curr) => {
        if(curr.userId) {
          const { dateOfBirth, fullname, phonenumber, address, gender, email } = curr.userId as any;
          acc.push({
            Ho_Va_Ten: Convert.vietnameseUnsigned(fullname),
            Ngay_Sinh: MomentTimezone.convertDDMMYYY(dateOfBirth),
            Gioi_Tinh: MappingGender[gender],
            So_BHYT: `${curr.insurance}`,
            Email: email,
            So_Dien_Thoai: `${phonenumber}`,
            Dia_Chi: Convert.vietnameseUnsigned(address),
          })
        }
        return acc;
      }, []);
      return response;
  }

  public static getAllPatientOnBoardingCsv = async (departmentId, boardingStatus) => {
    const patients = (await Boarding
      .find({ departmentId, boardingStatus: boardingStatus })
      .select(`-__v`)
      .populate({
        path: schemaFields.patientId,
        populate: ({
          path: schemaFields.userId,
          select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`
        })
      })
      .populate({ path: schemaFields.departmentId, select: `${schemaFields.departmentName}` })
      .lean()).reduce((acc, cur) => {
        const { departmentName} = cur.departmentId as any;
        const { userId: userIdOfPatient, insurance } = cur.patientId as any;
        const { dateOfBirth, fullname, phonenumber, address, gender, email } = userIdOfPatient as any;
        acc.push({
          Khoa: Convert.vietnameseUnsigned(departmentName),
          Ngay_Nhap_Vien: MomentTimezone.convertDDMMYYY(cur.onBoardingDate),
          Ten_Benh_Nhan: Convert.vietnameseUnsigned(fullname),
          Gioi_Tinh: MappingGender[gender],
          Ngay_Sinh: MomentTimezone.convertDDMMYYY(dateOfBirth),
          So_BHYT: insurance,
          So_Dien_Thoai: phonenumber,
          Dia_Chi: Convert.vietnameseUnsigned(address),
          Email: email
        })
        return acc
      }, [])
    return patients;
  }
}