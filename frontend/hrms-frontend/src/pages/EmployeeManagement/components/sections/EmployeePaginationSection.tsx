interface EmployeePaginationSectionProps {
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function EmployeePaginationSection({
  currentPage,
  itemsPerPage,
  totalCount,
  totalPages,
  onPageChange,
}: EmployeePaginationSectionProps) {
  if (totalCount <= itemsPerPage) return null;

  return (
    <div className="em-pagination">
      <div className="em-pag-info">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
        employees
      </div>
      <div className="em-pag-btns">
        <button
          className="em-pag-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`em-pag-btn ${currentPage === n ? "active" : ""}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="em-pag-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
