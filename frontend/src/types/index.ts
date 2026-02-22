export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient' | 'pharmacist' | 'lab_technician';

export const UserRoleEnum = {
  ADMIN: 'admin' as UserRole,
  DOCTOR: 'doctor' as UserRole,
  NURSE: 'nurse' as UserRole,
  RECEPTIONIST: 'receptionist' as UserRole,
  PATIENT: 'patient' as UserRole,
  PHARMACIST: 'pharmacist' as UserRole,
  LAB_TECHNICIAN: 'lab_technician' as UserRole,
};

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
  };
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
}

export interface AppointmentData {
  id?: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  reason: string;
  isVirtual: boolean;
}

export interface PatientData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  bloodType: string;
  allergies: string[];
}

export interface DoctorData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  qualifications: string[];
  consultationFee: number;
}
