interface RelievingPaginationSectionProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function RelievingPaginationSection({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
}: RelievingPaginationSectionProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="er-pagination">
      <div className="er-pag-info">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
        results
      </div>
      <div className="er-pag-btns">
        <button
          className="er-pag-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`er-pag-btn ${p === currentPage ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="er-pag-btn"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
