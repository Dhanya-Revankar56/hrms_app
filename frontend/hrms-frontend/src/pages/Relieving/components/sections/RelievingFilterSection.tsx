interface RelievingFilters {
  search: string;
  department: string;
  status: string;
  dateFrom: string;
}

interface RelievingFilterSectionProps {
  filters: RelievingFilters;
  onFilterChange: (key: keyof RelievingFilters, val: string) => void;
  departments: string[];
  totalCount: number;
  filteredCount: number;
}

export default function RelievingFilterSection({
  filters,
  onFilterChange,
  departments,
  totalCount,
  filteredCount,
}: RelievingFilterSectionProps) {
  return (
    <div className="er-filter-bar">
      <div className="er-search-wrap">
        <span className="er-search-icon">
          <svg
            width="13"
            height="13"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
        </span>
        <input
          className="er-search"
          placeholder="Search name or ID…"
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>

      <div className="er-filter-divider" />

      <select
        className="er-filter-sel"
        value={filters.department}
        onChange={(e) => onFilterChange("department", e.target.value)}
      >
        {departments.map((d: string) => (
          <option key={d} value={d}>
            {d === "All" ? "All Departments" : d}
          </option>
        ))}
      </select>

      <select
        className="er-filter-sel"
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
      >
        <option value="All">All Status</option>
        <option value="Pending Approval">Pending Approval</option>
        <option value="Approved">Approved</option>
        <option value="Clearance In Progress">Clearance In Progress</option>
        <option value="Relieved">Relieved</option>
        <option value="Rejected">Rejected</option>
      </select>

      <input
        type="date"
        className="er-filter-date"
        value={filters.dateFrom}
        onChange={(e) => onFilterChange("dateFrom", e.target.value)}
      />

      <span className="er-filter-count">
        {filteredCount} of {totalCount} records
      </span>
    </div>
  );
}
