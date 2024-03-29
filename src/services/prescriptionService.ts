import Prescription from "../schema/Prescription"

export default class prescriptionService {
  public static create = async (newPrescription, session) => {
    try {
      const prescription = new Prescription(newPrescription);
      return await prescription.save({session}) 
    } catch (error) {
      throw error
    }
  }
  public static findOneByKey = async (key, value) => {
    return await Prescription.findOne({[key]: value}).lean();
  }
}