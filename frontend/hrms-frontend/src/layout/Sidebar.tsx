import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      style={{
        width: "240px",
        height: "100vh",
        backgroundColor: "#1e3a5f",
        color: "white",
        padding: "20px"
      }}
    >
      <h2>HRMS</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/onboarding">Employee Onboarding</Link></li>
        <li><Link to="/employees">Employee Management</Link></li>
        <li><Link to="/attendance">Attendance</Link></li>
        <li><Link to="/leave">Leave</Link></li>
        <li><Link to="/movement">Movement Register</Link></li>
        <li><Link to="/relieving">Relieving</Link></li>
        <li><Link to="/register">Event Register</Link></li>
        <li><Link to="/reports">Reports & Analytics</Link></li>
        <li><Link to="/settings">Settings</Link></li>

      </ul>
    </div>
  );
}