interface LeaveFilters {
  department: string;
  leaveType: string;
  monthYear: string;
  status: string;
}

interface LeaveFilterSectionProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filters: LeaveFilters;
  onFilterChange: (key: keyof LeaveFilters, val: string) => void;
  departments: { id: string; name: string }[];
  leaveTypes: string[];
  getLeaveName: (type: string) => string;
  totalCount: number;
}

export default function LeaveFilterSection({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  departments,
  leaveTypes,
  getLeaveName,
  totalCount,
}: LeaveFilterSectionProps) {
  return (
    <div className="lv-filter-bar">
      <div className="lv-search-wrap">
        <span className="lv-search-icon">
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
          className="lv-search"
          placeholder="Search name or ID…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="lv-filter-divider" />

      <select
        className="lv-filter-sel"
        value={filters.department}
        onChange={(e) => onFilterChange("department", e.target.value)}
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        className="lv-filter-sel"
        value={filters.leaveType}
        onChange={(e) => onFilterChange("leaveType", e.target.value)}
      >
        {leaveTypes.map((lt: string) => (
          <option key={lt} value={lt}>
            {lt === "All" ? "All Leave Types" : getLeaveName(lt)}
          </option>
        ))}
      </select>

      <input
        type={filters.monthYear ? "month" : "text"}
        placeholder="Month"
        onFocus={(e) => (e.target.type = "month")}
        onBlur={(e) => !e.target.value && (e.target.type = "text")}
        className="lv-filter-sel"
        style={{
          width: "130px",
          paddingRight: "10px",
          backgroundImage: "none",
        }}
        value={filters.monthYear}
        onChange={(e) => onFilterChange("monthYear", e.target.value)}
      />

      <select
        className="lv-filter-sel"
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
      >
        <option value="All">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      <span className="lv-filter-count">{totalCount} total request(s)</span>
    </div>
  );
}
