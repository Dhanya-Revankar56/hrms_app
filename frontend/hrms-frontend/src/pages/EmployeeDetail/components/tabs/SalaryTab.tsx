interface SalaryTabProps {
  salaryData:
    | {
        salaryRecord: {
          monthly_ctc: number;
          annual_ctc: number;
          net_monthly_salary: number;
          net_annual_salary: number;
          earnings: {
            basic: number;
            agp: number;
            da: number;
            hra: number;
          };
        };
      }
    | undefined;
}

export default function SalaryTab({ salaryData }: SalaryTabProps) {
  const salary = salaryData?.salaryRecord;
  return (
    <>
      <div className="ed-content-grid">
        <div className="ed-section">
          <h2 className="ed-sec-title">Current Salary Structure</h2>
          <div className="ed-salary-card">
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">Monthly CTC</span>
              <span className="ed-salary-val">
                ₹{salary?.monthly_ctc?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">Annual CTC</span>
              <span className="ed-salary-val">
                ₹{salary?.annual_ctc?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">Net Monthly Salary</span>
              <span className="ed-salary-val">
                ₹{salary?.net_monthly_salary?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">Net Annual Salary</span>
              <span className="ed-salary-val">
                ₹{salary?.net_annual_salary?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
        </div>
        <div className="ed-section">
          <h2 className="ed-sec-title">Earnings Breakdown</h2>
          <div className="ed-salary-card">
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">Basic</span>
              <span className="ed-salary-val">
                ₹{salary?.earnings?.basic?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">AGP</span>
              <span className="ed-salary-val">
                ₹{salary?.earnings?.agp?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">DA</span>
              <span className="ed-salary-val">
                ₹{salary?.earnings?.da?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="ed-salary-item">
              <span className="ed-salary-lbl">HRA</span>
              <span className="ed-salary-val">
                ₹{salary?.earnings?.hra?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
