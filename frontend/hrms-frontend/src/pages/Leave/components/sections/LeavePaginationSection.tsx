interface LeavePaginationSectionProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  filteredTotal: number;
}

export default function LeavePaginationSection({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  filteredTotal,
}: LeavePaginationSectionProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="lv-pagination">
      <div className="lv-pag-info">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, filteredTotal)} of {filteredTotal}{" "}
        results
      </div>
      <div className="lv-pag-btns">
        <button
          className="lv-pag-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`lv-pag-btn ${p === currentPage ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="lv-pag-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
