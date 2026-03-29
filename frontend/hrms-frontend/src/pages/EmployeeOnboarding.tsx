// src/pages/EmployeeOnboarding.tsx

import { useState, useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CREATE_EMPLOYEE, GET_EMPLOYEES } from "../graphql/employeeQueries";
import { GET_SETTINGS } from "../graphql/settingsQueries";
import { formatDateForDisplay } from "../utils/dateUtils";

/* ─────────────────────────────────────────────
   TYPES
 ───────────────────────────────────────────── */
type StatusType     = "Draft" | "Pending" | "Completed";

interface OnboardingEmployee {
  id: string; title: string; firstName: string; lastName: string; email: string; phone: string;
  hrDepartment: string; academicsDepartment: string; designation: string; dateOfJoining: string;
  employmentType: string; employmentSubType: string; category: string; hiringSource: string;
  experienceYears: string; experienceMonths: string; previousQualification: string; 
  reportingTo: string; employeeImage: string;
  fatherName: string; aadhaar: string; pan: string; passport: string; pfNumber: string; esicNumber: string;
  dob: string; bloodGroup: string; gender: string; maritalStatus: string; religion: string; caste: string;
  personalCategory: string; secondaryEmail: string; secondaryContact: string; scholarLink: string;
  linkedinLink: string; addressLine1: string; addressLine2: string; country: string; state: string;
  city: string; pinCode: string; status: StatusType;
  bankName: string; accountNo: string; ifsc: string;
  hasSecondaryBank: boolean; bankName2: string; accountNo2: string; ifsc2: string;
}

interface SettingsData {
  settings: {
    departments: { id: string; name: string }[];
    designations: { id: string; name: string }[];
    employee_categories: { id: string; name: string }[];
    employee_types: { id: string; name: string }[];
    leave_types: { name: string; total_days: number }[];
  };
}

interface BackendEmployee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  user_contact: string;
  app_status: string;
  work_detail?: {
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
    date_of_joining?: string;
  };
}

type FormState = Omit<OnboardingEmployee, "id" | "status">;
interface FormErrors { [key: string]: string; }

/* ─────────────────────────────────────────────
   CONSTANTS (Frontend Only)
 ───────────────────────────────────────────── */
const TITLES = ["Dr.", "Mr.", "Mrs.", "Shri.", "Smt."];
const HIRING_SOURCES = ["Advertisement", "LinkedIN", "Referral", "Job Portal"];
const BLOOD_GROUPS   = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const RELIGIONS      = ["Buddhists", "Christian", "Hindu", "Jains", "Muslim", "Others", "Sikhs"];
const GENDERS        = ["Male", "Female", "Other"];
const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed"];

const EMPTY_FORM: FormState = {
  title: "", firstName: "", lastName: "", email: "", phone: "",
  hrDepartment: "", academicsDepartment: "", designation: "",
  dateOfJoining: "", employmentType: "", employmentSubType: "",
  category: "", hiringSource: "", experienceYears: "", experienceMonths: "",
  previousQualification: "", reportingTo: "", fatherName: "", aadhaar: "", pan: "",
  passport: "", pfNumber: "", esicNumber: "", dob: "", bloodGroup: "",
  gender: "", maritalStatus: "", religion: "", caste: "", personalCategory: "",
  secondaryEmail: "", secondaryContact: "", scholarLink: "", linkedinLink: "",
  addressLine1: "", addressLine2: "", country: "", state: "", city: "", pinCode: "",
  bankName: "", accountNo: "", ifsc: "",
  hasSecondaryBank: false, bankName2: "", accountNo2: "", ifsc2: "",
  employeeImage: ""
};

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap');
  .ob-container { padding: 24px; font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }
  .ob-header { margin-bottom: 24px; }
  .ob-title { font-size: 24px; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; }
  .ob-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .ob-section-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; background: #fafbfe; }
  .ob-section-title { font-size: 16px; font-weight: 700; color: #334155; }
  .ob-form-body { padding: 24px; }
  .ob-group { margin-bottom: 32px; }
  .ob-group-label { font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .ob-group-label::after { content: ''; flex: 1; height: 1px; background: #eff6ff; }
  .ob-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
  .ob-field { display: flex; flex-direction: column; gap: 6px; }
  .ob-label { font-size: 13px; font-weight: 600; color: #475569; }
  .ob-input, .ob-select { height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; outline: none; transition: 0.2s; font-size: 13.5px; }
  .ob-input:focus, .ob-select:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .ob-error-text { color: #ef4444; font-size: 11.5px; margin-top: 4px; font-weight: 500; }
  .ob-form-actions { padding: 16px 24px; border-top: 1px solid #f1f5f9; background: #fafbfe; display: flex; justify-content: flex-end; gap: 12px; }
  .ob-btn { height: 40px; padding: 0 24px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 13.5px; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .ob-btn-primary { background: #3b82f6; color: #fff; }
  .ob-btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
  .ob-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  
  .ob-btn-secondary { background: #f1f5f9; color: #334155; }
  .ob-btn-secondary:hover { background: #e2e8f0; color: #0f172a; }

  /* Table styles */
  .ob-table-wrap { overflow-x: auto; }
  .ob-table { width: 100%; border-collapse: collapse; }
  .ob-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  .ob-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; }
  .ob-status-badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #64748b; }
  .ob-status-active { background: #f0fdf4; color: #15803d; }

  .ob-toast { position: fixed; bottom: 24px; right: 24px; background: #1e293b; color: #fff; padding: 12px 20px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 1000; animation: slideUp 0.3s ease; font-size: 13.5px; font-weight: 500; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .ob-image-preview { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; margin-top: 8px; }

  /* Add dark mode overrides for input backgrounds if dark mode is active (assuming it is on 'html' level) */
  html[data-theme='dark'] .ob-section { background: #1e293b; border-color: #334155; }
  html[data-theme='dark'] .ob-section-header { background: #0f172a; border-color: #334155; }
  html[data-theme='dark'] .ob-title, html[data-theme='dark'] .ob-section-title, html[data-theme='dark'] .ob-label { color: #f1f5f9; }
  html[data-theme='dark'] .ob-input, html[data-theme='dark'] .ob-select { background: #0f172a; border-color: #334155; color: #f1f5f9; }
  html[data-theme='dark'] .ob-input:focus, html[data-theme='dark'] .ob-select:focus { background: #1e293b; border-color: #3b82f6; }
  html[data-theme='dark'] .ob-form-actions { background: #0f172a; border-color: #334155; }
  html[data-theme='dark'] .ob-btn-secondary { background: #334155; color: #f1f5f9; }
  html[data-theme='dark'] .ob-btn-secondary:hover { background: #475569; }
`;

function Field({ label, error, required = false, children }: { label: string; error?: string; required?: boolean; children?: ReactNode; }) {
  return (
    <div className="ob-field">
      <label className="ob-label">{label}{required && <span style={{color:"red"}}> *</span>}</label>
      {children}
      {error && <span className="ob-error-text">{error}</span>}
    </div>
  );
}

export default function EmployeeOnboarding() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: settingsData } = useQuery<SettingsData>(GET_SETTINGS);
  const { data: employeesData, refetch: refetchEmployees } = useQuery<{ getAllEmployees: { items: BackendEmployee[] } }>(GET_EMPLOYEES, {
    fetchPolicy: 'network-only'
  });
  const [createEmployee, { loading }] = useMutation(CREATE_EMPLOYEE);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState("");

  const departments = settingsData?.settings?.departments || [];
  const designations = settingsData?.settings?.designations || [];
  const categories = settingsData?.settings?.employee_categories || [];
  const empTypes = settingsData?.settings?.employee_types || [];
  const allEmployees = employeesData?.getAllEmployees?.items || [];
  
  // The user requested that we list users from User Management in the dropdown. 
  // We'll show all users as they map to "employees".
  const reportingManagers = allEmployees.filter((e) => e.app_status === "active");

  const recentlyOnboarded = allEmployees.slice(0, 5); // Newest employees first from the backend sort

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(p => ({ ...p, [name]: checked }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors(p => { const n = {...p}; delete n[name]; return n; });
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(p => ({ ...p, employeeImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  function validate() {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.hrDepartment) e.hrDepartment = "Required";
    if (!form.designation) e.designation = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    
    // Construct Bank Details
    const banks = [];
    if (form.bankName) {
      banks.push({
        bank_name: form.bankName, account_no: form.accountNo,
        ifsc: form.ifsc, bank_type: "Primary"
      });
    }
    if (form.hasSecondaryBank && form.bankName2) {
      banks.push({
        bank_name: form.bankName2, account_no: form.accountNo2,
        ifsc: form.ifsc2, bank_type: "Secondary"
      });
    }

    try {
      const { data } = await createEmployee({ variables: { input: {
        first_name: form.firstName,
        last_name: form.lastName,
        user_email: form.email,
        user_contact: form.phone,
        employee_image: form.employeeImage,
        app_role: "Employee",
        reporting_to: form.reportingTo || null,
        personal_detail: {
          date_of_birth: form.dob,
          gender: form.gender,
          marital_status: form.maritalStatus,
          blood_group: form.bloodGroup,
          aadhar_no: form.aadhaar,
          pan_no: form.pan,
          pf_no: form.pfNumber,
          esic_no: form.esicNumber
        },
        work_detail: {
          date_of_joining: form.dateOfJoining,
          designation: form.designation,
          department: form.hrDepartment,
          employee_type: form.employmentType
        },
        bank_detail: banks
      } } });
      
      if (data) {
        setToast("Employee Registered Successfully!");
        setForm(EMPTY_FORM);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetchEmployees();
        setTimeout(() => setToast(""), 3000);
      }
    } catch (e: unknown) { setToast(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <div className="ob-container">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="ob-header">
        <h1 className="ob-title">Employee Onboarding</h1>
      </div>

      <div className="ob-section">
        <div className="ob-section-header"><div className="ob-section-title">New Employee Registration Form</div></div>
        <div className="ob-form-body">
          
          {/* BASIC INFO */}
          <div className="ob-group">
            <div className="ob-group-label">Basic Information</div>
            <div className="ob-row" style={{gridTemplateColumns: "100px 1fr 1fr"}}>
              <Field label="Title">
                <select name="title" value={form.title} onChange={handleChange} className="ob-select">
                  <option value="">Select</option>
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="First Name" required error={errors.firstName}>
                <input name="firstName" value={form.firstName} onChange={handleChange} className="ob-input" placeholder="First Name" />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <input name="lastName" value={form.lastName} onChange={handleChange} className="ob-input" placeholder="Last Name" />
              </Field>
            </div>
            <div className="ob-row">
              <Field label="Email Address" required error={errors.email}>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="ob-input" placeholder="official.email@institution.edu" />
              </Field>
              <Field label="Contact Number" required error={errors.phone}>
                <input name="phone" value={form.phone} onChange={handleChange} className="ob-input" placeholder="10-digit primary contact" />
              </Field>
              <Field label="Employee Photo (Optional)">
                <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="ob-input" style={{ paddingTop: '6px' }} />
                {form.employeeImage && <img src={form.employeeImage} alt="Preview" className="ob-image-preview" />}
              </Field>
            </div>
          </div>

          {/* WORK INFO */}
          <div className="ob-group">
            <div className="ob-group-label">Administrative & Academic Work</div>
            <div className="ob-row">
              <Field label="HR Department" required error={errors.hrDepartment}>
                <select name="hrDepartment" value={form.hrDepartment} onChange={handleChange} className="ob-select">
                  <option value="">Select HR Dept</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Designation" required error={errors.designation}>
                <select name="designation" value={form.designation} onChange={handleChange} className="ob-select">
                  <option value="">Select Designation</option>
                  {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Reporting To">
                <select name="reportingTo" value={form.reportingTo} onChange={handleChange} className="ob-select">
                  <option value="">Select Manager</option>
                  {reportingManagers.map((m) => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="ob-row">
              <Field label="Date of Joining">
                <input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange} className="ob-input" />
              </Field>
              <Field label="Employee Type">
                <select name="employmentType" value={form.employmentType} onChange={handleChange} className="ob-select">
                  <option value="">Select Type</option>
                  {empTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="Employee Category">
                <select name="category" value={form.category} onChange={handleChange} className="ob-select">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="ob-row" style={{gridTemplateColumns: "1fr 1fr 2fr"}}>
              <Field label="Experience (Years)">
                <input name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={handleChange} className="ob-input" placeholder="Years" />
              </Field>
              <Field label="Experience (Months)">
                <input name="experienceMonths" type="number" min="0" max="11" value={form.experienceMonths} onChange={handleChange} className="ob-input" placeholder="Months" />
              </Field>
              <Field label="Hiring Source">
                <select name="hiringSource" value={form.hiringSource} onChange={handleChange} className="ob-select">
                  <option value="">Select Source</option>
                  {HIRING_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* PERSONAL INFO & EDUCATION */}
          <div className="ob-group">
            <div className="ob-group-label">Personal Identifiers & Education</div>
            <div className="ob-row">
              <Field label="Date of Birth"><input name="dob" type="date" value={form.dob} onChange={handleChange} className="ob-input" /></Field>
              <Field label="Gender">
                <select name="gender" value={form.gender} onChange={handleChange} className="ob-select">
                  <option value="">Select</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Blood Group">
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="ob-select">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Marital Status">
                <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className="ob-select">
                  <option value="">Select</option>
                  {MARITAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="ob-row">
              <Field label="Father's Name"><input name="fatherName" value={form.fatherName} onChange={handleChange} className="ob-input" placeholder="Full name" /></Field>
              <Field label="Aadhaar Number"><input name="aadhaar" value={form.aadhaar} onChange={handleChange} className="ob-input" maxLength={12} placeholder="12-digit UIDAI" /></Field>
              <Field label="PAN Number"><input name="pan" value={form.pan} onChange={handleChange} className="ob-input" maxLength={10} placeholder="ABCDE1234F" /></Field>
              <Field label="Religion">
                <select name="religion" value={form.religion} onChange={handleChange} className="ob-select">
                  <option value="">Select</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <div className="ob-row">
              <Field label="PF Number"><input name="pfNumber" value={form.pfNumber} onChange={handleChange} className="ob-input" placeholder="Provident Fund Number" /></Field>
              <Field label="ESIC Number"><input name="esicNumber" value={form.esicNumber} onChange={handleChange} className="ob-input" placeholder="ESIC ID Number" /></Field>
              <Field label="Education / Qualification"><input name="previousQualification" value={form.previousQualification} onChange={handleChange} className="ob-input" placeholder="e.g. Ph.D. in Computer Science" /></Field>
            </div>
          </div>

          {/* ADDRESS */}
          <div className="ob-group">
            <div className="ob-group-label">Residential Address</div>
            <div className="ob-row" style={{gridTemplateColumns: "2fr 1fr 1fr"}}>
              <Field label="Address Line 1"><input name="addressLine1" value={form.addressLine1} onChange={handleChange} className="ob-input" placeholder="House/Flat No, Apartment, Street" /></Field>
              <Field label="City"><input name="city" value={form.city} onChange={handleChange} className="ob-input" placeholder="City" /></Field>
              <Field label="PIN Code"><input name="pinCode" value={form.pinCode} onChange={handleChange} className="ob-input" maxLength={6} placeholder="6-digit ZIP" /></Field>
            </div>
          </div>

          {/* BANK DETAILS */}
          <div className="ob-group">
            <div className="ob-group-label" style={{ justifyContent: 'space-between' }}>
              <span>Bank Account Details</span>
              <button 
                type="button" 
                className="ob-btn ob-btn-secondary" 
                style={{ height: '28px', fontSize: '12px', padding: '0 12px' }}
                onClick={() => setForm(p => ({ ...p, hasSecondaryBank: !p.hasSecondaryBank }))}
              >
                {form.hasSecondaryBank ? "- Remove Secondary Account" : "+ Add Secondary Account"}
              </button>
            </div>
            <div className="ob-row">
              <Field label="Primary Bank Name">
                <input name="bankName" value={form.bankName} onChange={handleChange} className="ob-input" placeholder="e.g. State Bank of India" />
              </Field>
              <Field label="Primary Account Number">
                <input name="accountNo" value={form.accountNo} onChange={handleChange} className="ob-input" placeholder="Enter bank account no" />
              </Field>
              <Field label="Primary IFSC Code">
                <input name="ifsc" value={form.ifsc} onChange={handleChange} className="ob-input" placeholder="SBIN000XXXX" />
              </Field>
            </div>
            {form.hasSecondaryBank && (
              <div className="ob-row" style={{ marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                <Field label="Secondary Bank Name">
                  <input name="bankName2" value={form.bankName2} onChange={handleChange} className="ob-input" placeholder="Optional secondary bank" />
                </Field>
                <Field label="Secondary Account Number">
                  <input name="accountNo2" value={form.accountNo2} onChange={handleChange} className="ob-input" placeholder="Enter bank account no" />
                </Field>
                <Field label="Secondary IFSC Code">
                  <input name="ifsc2" value={form.ifsc2} onChange={handleChange} className="ob-input" placeholder="SBIN000XXXX" />
                </Field>
              </div>
            )}
          </div>

        </div>
        <div className="ob-form-actions">
          <button className="ob-btn ob-btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Processing..." : "Register & Onboard"}</button>
        </div>
      </div>

      {/* RECENT LIST */}
      <div className="ob-section">
        <div className="ob-section-header"><div className="ob-section-title">Recently Onboarded Employees</div></div>
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentlyOnboarded.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>No employees onboarded yet.</td></tr>
              ) : recentlyOnboarded.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{emp.employee_id || "PENDING"}</td>
                  <td style={{ fontWeight: 700 }}>{emp.first_name} {emp.last_name}</td>
                  <td>{emp.work_detail?.department?.name || "—"}</td>
                  <td>{emp.work_detail?.designation?.name || "—"}</td>
                  <td>{formatDateForDisplay(emp.work_detail?.date_of_joining)}</td>
                  <td><span className="ob-status-badge ob-status-active">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="ob-toast">{toast}</div>}
    </div>
  );
}
