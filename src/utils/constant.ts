export const collectionName = {
  User: 'User',
  Doctor: 'Doctor',
  Patient: 'Patient',
  Department: 'Department',
  Histories: 'Histories',
  Diseases: 'Diseases',
  Medications: 'Medications',
  Security: 'Security',
  Health: 'Health',
  Post: "Post",
  AppointmentSchedule: 'AppointmentSchedule',
  Boarding: 'Boarding',
  HealthDiseases: 'HealthDiseases',
  TestService: 'TestService',
  TestResult: 'TestResult',
  Prescription: 'Prescription',
  Bill: 'Bill',
}

export const schemaFields = {
  newpassword: "newpassword",
  //
  searchKey: 'searchKey',
  page: 'page',
  pageSize: 'pageSize',
  tableType: 'tableType',
  //
  id: 'id',
  _id: '_id',
  //user 
  email: 'email',
  avatar: 'avatar',
  fullname: 'fullname',
  phonenumber: 'phonenumber',
  gender: 'gender',
  address: 'address',
  dateOfBirth: 'dateOfBirth',
  identification: 'identification',

  //test service
  service: 'service',
  price: 'price',
  testservices: 'testservices',

  //test result 
  doctorId: 'doctorId',
  reason: 'reason',
  serviceId: 'serviceId',
  historyId: 'historyId',
  detailsFileCloud: 'detailsFileCloud',
  testResults: 'testResults',

  //security
  username: 'username',
  password: 'password',
  userId: 'userId',
  role: 'role',
  refreshToken: 'refreshToken',

  //prescription
  medicationId: 'medicationId',

  //Post
  author: 'author',
  title: 'title',
  content: 'content',
  image: 'image',
  template: 'template',

  //patient
  insurance: 'insurance',
  hospitalization: 'hospitalization',

  //medication
  name: 'name',
  designation: 'designation',
  usage: 'usage',
  isActive: 'isActive',

  //histories
  appointmentScheduleId: 'appointmentScheduleId',
  diagnosis: 'diagnosis',
  hospitalizationCount: 'hospitalizationCount',
  summary: 'summary',

  //healthDiseases
  healthId: 'healthId',
  diseaseId: 'diseaseId',

  //health
  patientId: 'patientId',
  heartRate: 'heartRate',
  temperature: 'temperature',
  bloodPressureSystolic: 'bloodPressureSystolic',
  bloodPressureDiastolic: 'bloodPressureDiastolic',
  glucose: 'glucose',
  weight: 'weight',
  height: 'height',

  //Doctor
  departmentId: 'departmentId',
  rank: 'rank',
  position: 'position',

  //diseases
  diseasesCode: 'diseasesCode',
  diseasesName: 'diseasesName',
  symptom: 'symptom',
  prevention: 'prevention',

  //department
  departmentName: 'departmentName',
  departmentCode: 'departmentCode',

  //boarding
  boardingStatus: 'boardingStatus',

  //appointmentSchedule
  appointmentDate: 'appointmentDate',
  approve: 'approve',
  typeAppointment: 'typeAppointment',
  initialSymptom: 'initialSymptom',
  statusAppointment: 'statusAppointment',
  statusUpdateTime: 'statusUpdateTime',
  healthIndicator: 'healthIndicator',

  note: 'note',
  // chart
  dataSource: 'dataSource',
}

export const TableResponseNoData = {
  values: [],
  total: 0
}

export const defaultAvatar = 'https://res.cloudinary.com/dipiauw0v/image/upload/v1682100699/DATN/unisex_avatar.jpg?fbclid=IwAR0rfobILbtfTZlNoWFiWmHYPH7bPMKFP0ztGnT8CVEXtvgTOEPEBgYtxY8'