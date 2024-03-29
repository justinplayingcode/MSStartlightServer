import { Router } from 'express';
import Middlewares from '../middlewares';
import { Role } from '../utils/enum';
import HealthcareController from '../controllers/healthcareController';

const healthcareRoute = Router();

healthcareRoute.route('/getinfobyuserid').post(Middlewares.verifyToken, Middlewares.permission([Role.doctor]), HealthcareController.getPatientByUserId) //done
healthcareRoute.route('/registerpatient').post(Middlewares.verifyToken, Middlewares.permission([Role.doctor]), HealthcareController.registerPatient); //done
healthcareRoute.route('/searchinsurance').post(Middlewares.verifyToken, Middlewares.permission([Role.doctor]), HealthcareController.searchPatientByInsurance); //done
healthcareRoute.route("/getallpatientonbroading").post(Middlewares.verifyToken, Middlewares.permission([Role.doctor]), HealthcareController.getListPatientOnBoarding);
healthcareRoute.route("/gethistorymedical").post(Middlewares.verifyToken, Middlewares.permission([Role.doctor, Role.patient]), HealthcareController.getHistoryMedical);
// get detail historymedical
healthcareRoute.route("/gethistorymedicaldetails").get(Middlewares.verifyToken, HealthcareController.getHistoryMedicalDetails);
healthcareRoute.route("/pill").get(Middlewares.verifyToken, Middlewares.permission([Role.patient]), HealthcareController.getPill);
// healthcareRoute.route("/createtestservice").post(Middlewares.verifyToken, Middlewares.permission([Role.admin]), HealthcareController.createTestService);
healthcareRoute.route("/alltestservice").get(Middlewares.verifyToken, HealthcareController.getListTestService);
healthcareRoute.route("/gethistorymedical").get(Middlewares.verifyToken, Middlewares.permission([Role.doctor]), HealthcareController.getDetailsPatientWithHistory);
export default healthcareRoute;