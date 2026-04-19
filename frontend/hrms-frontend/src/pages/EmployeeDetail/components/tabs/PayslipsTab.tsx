/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable no-empty-pattern */
export default function PayslipsTab({}: any) {
  return (
    <>
      <div className="ed-section">
        <h2 className="ed-sec-title">Monthly Payslips</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 13,
              textAlign: "center",
              padding: 20,
            }}
          >
            No payslips generated yet.
          </div>
        </div>
      </div>
    </>
  );
}
