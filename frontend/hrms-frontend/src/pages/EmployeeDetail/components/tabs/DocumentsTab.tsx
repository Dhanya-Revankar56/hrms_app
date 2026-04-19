import { EmployeeDocument } from "../../../../types";
import { formatDateForDisplay } from "../../../../utils/dateUtils";

export default function DocumentsTab({
  docsData,
}: {
  docsData: { employeeDocuments: EmployeeDocument[] } | undefined;
}) {
  return (
    <>
      <div className="ed-section">
        <h2 className="ed-sec-title">Uploaded Documents</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {docsData?.employeeDocuments?.map((doc: EmployeeDocument) => (
            <div
              key={doc.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1e293b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.name}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {formatDateForDisplay(doc.created_at)}
                </div>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#3b82f6" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
        {(!docsData?.employeeDocuments ||
          docsData.employeeDocuments.length === 0) && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "#94a3b8",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px dashed #e2e8f0",
            }}
          >
            No documents uploaded yet.
          </div>
        )}
      </div>
    </>
  );
}
