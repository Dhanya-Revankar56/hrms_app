interface FilterState {
  search: string;
  status: string;
  department: string;
  employmentType: string;
}

interface EmployeeFilterSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  departments: Array<{ id: string; name: string }>;
  employeeTypes: string[];
  loading: boolean;
}

export default function EmployeeFilterSection({
  filters,
  onFilterChange,
  departments,
  employeeTypes,
  loading,
}: EmployeeFilterSectionProps) {
  return (
    <div className="em-filter-bar">
      <input
        className="em-search"
        placeholder="Search by name or ID..."
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
      />
      <select
        className="em-select"
        value={filters.status}
        onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="On Leave">On Leave</option>
        <option value="Resigned">Resigned</option>
        <option value="Relieved">Relieved</option>
      </select>
      <select
        className="em-select"
        value={filters.department}
        onChange={(e) =>
          onFilterChange({ ...filters, department: e.target.value })
        }
      >
        <option value="All">All Departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <select
        className="em-select"
        value={filters.employmentType}
        onChange={(e) =>
          onFilterChange({ ...filters, employmentType: e.target.value })
        }
      >
        {employeeTypes.map((t) => (
          <option key={t} value={t}>
            {t === "All" ? "All Types" : t}
          </option>
        ))}
      </select>
      {loading && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#3b82f6",
            fontWeight: 600,
          }}
        >
          Refreshing...
        </span>
      )}
    </div>
  );
}
