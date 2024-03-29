import { ClientSession } from "mongoose";
import Doctor from "../schema/Doctor"
import { schemaFields } from "../utils/constant";
import { IChangeInfoByAdmin, ICreateDoctor } from "../models/Doctor";
import MomentTimezone from "../helpers/timezone";
import Convert from "../utils/convert";
import { MappingGender, MappingRank, mappingDoctorPosition } from "../models/common";

export default class DoctorService {
    public static totalCount = async () => {
      return await Doctor.countDocuments({ isActive: true });
    }
    public static createDoctor = async (obj: ICreateDoctor, session: ClientSession) => {
      try {
        const doctor = new Doctor(obj);
        return await doctor.save({ session });
      } catch (error) {
        throw error;
      }
    }
    public static getAll = async (page: number, pageSize: number, searchKey: string) => {
        const doctors = await Doctor.find({ isActive: true })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .select(`-__v -${schemaFields.isActive}`)
          .populate({
            path: schemaFields.userId,
            select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
            match: {
              fullname: { $regex: new RegExp(searchKey, 'i') }
            }
          })
          .populate({ path: schemaFields.departmentId, select: `${schemaFields.departmentName}` })
          .lean();
        
        const response = doctors.reduce((acc, curr) => {
          if(curr.userId) {
            const { dateOfBirth, _id, ...userInfo } = curr.userId as any;
            const { departmentName } = curr.departmentId as any;
            acc.push({
              position: curr.position,
              rank: curr.rank,
              ...userInfo,
              userId: _id,
              departmentName,
              dateOfBirth: MomentTimezone.convertDDMMYYY(dateOfBirth)
            })
          }
          return acc;
        }, []);

        const total = await (await Doctor.find({ isActive: true })
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
          values: response, 
          total: total.length 
        }
    }

    public static getInforByUserId = async (userId) => {
      return await Doctor.findOne({ userId: userId} )
        .populate({
          path: schemaFields.departmentId,
          select: `-__v`
        })
        .lean();
    }

    public static getTotalDoctorsInDepartment = async (departmentId) => {
      return await Doctor.find({ departmentId }).countDocuments();
    }

    public static getAllDoctorsInDepartment = async (page: number, pageSize: number, searchKey: string, departmentId) => {
      const values = (await Doctor
          .find(departmentId ? {departmentId, isActive: true} : {isActive: true})
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .select(`-__v -${schemaFields.isActive}`)
          .populate({
            path: schemaFields.userId,
            select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
            match: {
              fullname: { $regex: new RegExp(searchKey, 'i') }
            }
          })
          .populate({
            path: schemaFields.departmentId,
          })
          .lean())?.reduce((acc, curr) => {
            if(curr.userId) {
              const { dateOfBirth, _id, ...userInfo } = curr.userId as any;
              const { departmentName } = curr.departmentId as any;
              acc.push({
                position: curr.position,
                rank: curr.rank,
                ...userInfo,
                doctorId: curr._id,
                userId: _id,
                departmentName,
                dateOfBirth: MomentTimezone.convertDDMMYYY(dateOfBirth)
              })
            }
            return acc;
          }, []);

        const total = (await Doctor
          .find(departmentId ? {departmentId, isActive: true} : {isActive: true})
          .populate({
            path: schemaFields.userId,
            match: {
              fullname: { $regex: new RegExp(searchKey, 'i') }
            }
          }).lean())?.reduce((acc, cur) => {
            if(cur.userId) {
              acc.push(cur)
            }
            return acc;
          }, []);

        return {
          values,
          total: total.length
        }
    }

    public static findDepartmentOfDoctor = async (userId) => {
      const res = await Doctor
        .findOne({userId})
        .populate({
          path: schemaFields.departmentId,
          select: `-__v`
        })
        .select(`${schemaFields.departmentId}`)
        .lean()

      return res;
    }

    public static changeInfoByAdmin = async (id, updateObj: IChangeInfoByAdmin) => {
      return await Doctor.findByIdAndUpdate( id, updateObj, {runValidators: true});
    }

    public static deleteByAdmin = async (id) => {
      return await Doctor.findByIdAndUpdate( id, { isActive: false }, {runValidators: true});
    }

    public static getAllCsv = async () => {
      const doctors = await Doctor.find({ isActive: true })
          .select(`-__v -${schemaFields.isActive}`)
          .populate({
            path: schemaFields.userId,
            select: `${schemaFields.fullname} ${schemaFields.email} ${schemaFields.phonenumber} ${schemaFields.address} ${schemaFields.dateOfBirth} ${schemaFields.gender} ${schemaFields._id} ${schemaFields.identification}`,
          })
          .populate({ path: schemaFields.departmentId, select: `${schemaFields.departmentName}` })
          .lean();
        const response = doctors.reduce((acc, curr) => {
          if(curr.userId) {
            const { dateOfBirth, fullname, phonenumber, address, gender, email } = curr.userId as any;
            const { departmentName } = curr.departmentId as any;
            acc.push({
              Khoa: Convert.vietnameseUnsigned(departmentName),
              Ho_Va_Ten: Convert.vietnameseUnsigned(fullname),
              Ngay_Sinh: MomentTimezone.convertDDMMYYY(dateOfBirth),
              Gioi_Tinh: MappingGender[gender],
              Chuc_Vu: mappingDoctorPosition[curr.position],
              Trinh_Do: MappingRank[curr.rank],
              Email: email,
              So_Dien_Thoai: `${phonenumber}`,
              Dia_Chi: Convert.vietnameseUnsigned(address),
            })
          }
          return acc;
        }, []);
        return response;
    }
}