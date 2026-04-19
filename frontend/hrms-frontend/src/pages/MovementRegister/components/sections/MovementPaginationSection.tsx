interface MovementPaginationSectionProps {
  pageInfo:
    | {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
      }
    | undefined;
  onPageChange: (newPage: number) => void;
}

export default function MovementPaginationSection({
  pageInfo,
  onPageChange,
}: MovementPaginationSectionProps) {
  if (!pageInfo || pageInfo.totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderTop: "1px solid #f3f4f6",
      }}
    >
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        Showing Page <strong>{pageInfo.currentPage}</strong> of{" "}
        <strong>{pageInfo.totalPages}</strong> ({pageInfo.totalCount} total
        records)
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="mr-refresh"
          style={{
            height: "32px",
            opacity: pageInfo.currentPage === 1 ? 0.5 : 1,
          }}
          disabled={pageInfo.currentPage === 1}
          onClick={() => onPageChange(Math.max(1, pageInfo.currentPage - 1))}
        >
          Previous
        </button>
        <button
          className="mr-refresh"
          style={{ height: "32px", opacity: !pageInfo.hasNextPage ? 0.5 : 1 }}
          disabled={!pageInfo.hasNextPage}
          onClick={() => onPageChange(pageInfo.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
