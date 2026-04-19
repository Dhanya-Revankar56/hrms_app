interface MovementFilters {
  search: string;
  month: string;
  department: string;
  status: string;
}

interface MovementFilterSectionProps {
  filters: MovementFilters;
  onFilterChange: (key: keyof MovementFilters, value: string) => void;
  departments: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  isSpinning: boolean;
  resultCount: number;
}

export default function MovementFilterSection({
  filters,
  onFilterChange,
  departments,
  onRefresh,
  isSpinning,
  resultCount,
}: MovementFilterSectionProps) {
  return (
    <div className="mr-filter-bar">
      {/* Search box */}
      <div className="mr-search-wrap">
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
          className="mr-search-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
          />
        </svg>
        <input
          className="mr-search"
          placeholder="Search Employee..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>

      <div className="mr-filter-divider" />

      {/* Month */}
      <input
        type={filters.month ? "month" : "text"}
        placeholder="Month: All"
        onFocus={(e) => (e.target.type = "month")}
        onBlur={(e) => !e.target.value && (e.target.type = "text")}
        className="mr-filter-sel"
        value={filters.month}
        onChange={(e) => onFilterChange("month", e.target.value)}
        style={{ width: "140px", backgroundImage: "none" }}
      />

      {/* Department */}
      <select
        className="mr-filter-sel"
        value={filters.department}
        onChange={(e) => onFilterChange("department", e.target.value)}
        style={{ width: "160px" }}
      >
        <option value="All">All Departments</option>
        {departments.map((d: { id: string; name: string }) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Status */}
      <select
        className="mr-filter-sel"
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        style={{ width: "135px" }}
      >
        <option value="All">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      {/* Refresh */}
      <button
        className="mr-refresh"
        onClick={onRefresh}
        style={{ height: "36px", padding: "0 12px" }}
      >
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{
            transition: "transform .5s",
            transform: isSpinning ? "rotate(360deg)" : "none",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </button>

      <div className="mr-filter-count">{resultCount} Requests</div>
    </div>
  );
}
