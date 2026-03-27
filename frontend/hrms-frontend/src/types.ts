// src/types.ts
// This file contains type definitions used across the application.
// It is intentionally kept minimal to avoid circular imports.

export type EmpStatus = "Active" | "On Leave" | "Resigned" | "Terminated";
export type EmpType = "Permanent" | "Contract" | "Intern";
export type EmpRole = "HR Admin" | "Department Admin" | "Employee";
export type DocStatus = "Approved" | "Pending" | "Rejected";
export type SortField = "name" | "empId" | "department" | "status";
export type SortDir = "asc" | "desc";

export interface EmpDocument {
  name: string;
  status: DocStatus;
}

export interface ManagedEmployee {
  id: number;
  empId: string;
  title: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  personalEmail: string;
  phone: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  hrDepartment: string;
  academicsDepartment: string;
  designation: string;
  employmentType: EmpType;
  employmentSubType: string;
  category: string;
  hiringSource: string;
  experienceYears: string;
  experienceMonths: string;
  previousQualification: string;
  joiningDate: string;
  reportingManager: string;
  workLocation: string;
  fatherName: string;
  aadhaar: string;
  pan: string;
  passport: string;
  pfNumber: string;
  esicNumber: string;
  maritalStatus: string;
  religion: string;
  caste: string;
  personalCategory: string;
  secondaryEmail: string;
  secondaryContact: string;
  scholarLink: string;
  linkedinLink: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  status: EmpStatus;
  role: EmpRole;
  documents: EmpDocument[];
  salaryGrade: string;
  avatarColor: string;
}

export interface FilterState {
  search: string;
  status: EmpStatus | "All";
  department: string;
  employmentType: EmpType | "All";
  role: EmpRole | "All";
}
