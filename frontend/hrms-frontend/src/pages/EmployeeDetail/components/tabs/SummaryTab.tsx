import { Employee } from "../../../../types";
import { formatDateForDisplay } from "../../../../utils/dateUtils";

interface SummaryTabProps {
  empData: { employee: Employee } | undefined;
}

export default function SummaryTab({ empData }: SummaryTabProps) {
  const employee = empData?.employee;
  return (
    <>
      <div className="ed-content-grid">
        <div className="ed-section">
          <h2 className="ed-sec-title">Work & Organization</h2>
          <div className="ed-field">
            <div className="ed-label">Department</div>
            <div className="ed-value">
              {employee.work_detail?.department?.name || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Designation</div>
            <div className="ed-value">
              {employee.work_detail?.designation?.name || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Employee Type</div>
            <div className="ed-value">
              {employee.work_detail?.employee_type || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Date of Joining</div>
            <div className="ed-value">
              {formatDateForDisplay(employee.work_detail?.date_of_joining) ||
                "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Reporting Manager</div>
            <div className="ed-value">
              {employee.reporting_to
                ? `${employee.reporting_to.first_name} ${employee.reporting_to.last_name}`
                : "—"}
            </div>
          </div>
        </div>
        <div className="ed-section">
          <h2 className="ed-sec-title">Personal Details</h2>
          <div className="ed-field">
            <div className="ed-label">Gender</div>
            <div className="ed-value">
              {employee.personal_detail?.gender || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Date of Birth</div>
            <div className="ed-value">
              {formatDateForDisplay(employee.personal_detail?.date_of_birth) ||
                "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Official Email</div>
            <div className="ed-value">{employee.user_email}</div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Phone Number</div>
            <div className="ed-value">{employee.user_contact}</div>
          </div>
          <div className="ed-field">
            <div className="ed-label">Marital Status</div>
            <div className="ed-value">
              {employee.personal_detail?.marital_status || "—"}
            </div>
          </div>
        </div>
        <div className="ed-section">
          <h2 className="ed-sec-title">Identification</h2>
          <div className="ed-field">
            <div className="ed-label">Aadhar No</div>
            <div className="ed-value">
              {employee.personal_detail?.aadhar_no || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">PAN No</div>
            <div className="ed-value">
              {employee.personal_detail?.pan_no || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">PF No</div>
            <div className="ed-value">
              {employee.personal_detail?.pf_no || "—"}
            </div>
          </div>
          <div className="ed-field">
            <div className="ed-label">ESIC No</div>
            <div className="ed-value">
              {employee.personal_detail?.esic_no || "—"}
            </div>
          </div>
        </div>
        <div className="ed-section">
          <h2 className="ed-sec-title">Bank Details</h2>
          {employee.bank_detail && employee.bank_detail.length > 0 ? (
            employee.bank_detail.map(
              (
                bank: {
                  bank_type: string;
                  bank_name: string;
                  account_no: string;
                  ifsc: string;
                },
                idx: number,
              ) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 16,
                    borderBottom:
                      employee.bank_detail &&
                      idx < employee.bank_detail.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                    paddingBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    {bank.bank_type} Account
                  </div>
                  <div className="ed-field" style={{ marginTop: 8 }}>
                    <div className="ed-label">Bank Name</div>
                    <div className="ed-value">{bank.bank_name}</div>
                  </div>
                  <div className="ed-field">
                    <div className="ed-label">Account No</div>
                    <div className="ed-value">{bank.account_no}</div>
                  </div>
                  <div className="ed-field">
                    <div className="ed-label">IFSC Code</div>
                    <div className="ed-value">{bank.ifsc}</div>
                  </div>
                </div>
              ),
            )
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              No bank details available.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
