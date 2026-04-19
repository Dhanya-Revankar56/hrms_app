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

/* ─────────────────────────────────────────────
   BACKEND COMPATIBLE INTERFACES (Snake Case)
   ───────────────────────────────────────────── */

export interface Employee {
  id: string;
  employee_id: string;
  title: string;
  first_name: string;
  last_name: string;
  user_email: string;
  user_contact: string;
  app_status: string;
  work_detail?: {
    designation?: { name: string };
    department?: { name: string };
    employee_type?: string;
    date_of_joining?: string;
  };
  personal_detail?: {
    gender?: string;
    date_of_birth?: string;
    marital_status?: string;
    aadhar_no?: string;
    pan_no?: string;
    pf_no?: string;
    esic_no?: string;
  };
  bank_detail?: Array<{
    bank_type: string;
    bank_name: string;
    account_no: string;
    ifsc: string;
  }>;
  reporting_to?: {
    first_name: string;
    last_name: string;
  };
}

export interface Attendance {
  id: string;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
  working_hours: number;
  marked_by?: string;
}

export interface LeaveApproval {
  role: string;
  status: string;
  updated_at?: string;
  remarks?: string;
}

export interface LeaveDayBreakdown {
  date: string;
  leave_type: string;
}

export interface LeaveBalance {
  leave_type: string;
  balance: number;
}

export interface Leave {
  id: string;
  employee_id?: string;
  employee_code?: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string;
  document_url?: string;
  requested_date?: string;
  created_at?: string;
  status: string;
  is_half_day?: boolean;
  half_day_type?: string;
  day_breakdowns?: Array<{ date: string; leave_type: string }>;
  approvals: LeaveApproval[];
  employee?: {
    id: string;
    employee_id?: string;
    first_name: string;
    last_name: string;
    employee_image?: string;
    work_detail?: {
      department?: { id: string; name: string };
      designation?: { id: string; name: string };
    };
  };
}

export interface Movement {
  id: string;
  movement_date: string;
  movement_type: string;
  out_time: string;
  in_time?: string;
  purpose?: string;
  remarks?: string;
  status?: string;
  employee_code?: string;
  employee?: {
    employee_id: string;
    first_name: string;
    last_name: string;
  };
}

export interface SessionTiming {
  label?: string;
  before: string;
  marking: string;
  after: string;
  isOptional: boolean;
  before_display?: string;
  after_display?: string;
  marking_display?: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  created_at: string;
  file_url: string;
}

export interface Settings {
  leave_types: Array<{ name: string; total_days: number }>;
}

export interface EventLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  action_type: string;
  module_name: string;
  record_id?: string;
  description?: string;
  timestamp: string;
}

/* ─────────────────────────────────────────────
   MODULE SPECIFIC TYPES FOR STANDARDIZATION
   ───────────────────────────────────────────── */

export type MvStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Completed"
  | "Cancelled";

export interface MovementRecord {
  id: string;
  employee_id: string;
  employee_code: string;
  movement_type: string;
  from_location: string;
  to_location: string;
  purpose: string;
  movement_date: string;
  out_time: string;
  in_time: string;
  status: MvStatus;
  employee?: {
    employee_id: string;
    first_name: string;
    last_name: string;
    work_detail?: {
      department?: { id: string; name: string };
      designation?: { id: string; name: string };
    };
  };
}

export type ExitStatus =
  | "Pending Approval"
  | "Approved"
  | "Clearance In Progress"
  | "Relieved"
  | "Rejected";

export interface ExitRecord {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  avatarColor: string;
  officialEmail: string;
  phone: string;
  reportingManager: string;
  joiningDate: string;
  resignDate: string;
  lastWorkingDay: string;
  noticePeriod: number;
  exitReason: string;
  exitReasonDetail: string;
  status: string;
  appliedDate: string;
  approvedBy: string;
  approvedOn: string;
  hrRemarks: string;
  employeeDbId: string;
}

export type RelievingRecord = ExitRecord;

export type LeaveStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Closed"
  | "Cancelled";
