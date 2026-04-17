import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import EmployeeOnboarding from "./pages/EmployeeOnboarding";
import EmployeeManagement from "./pages/EmployeeManagement";
import Attendance from "./pages/attendance";
import Leave from "./pages/leave";
import Relieving from "./pages/relieving";
import DashboardLayout from "./layout/DashboardLayout";
import MovementRegister from "./pages/movementRegister";
import Settings from "./pages/Settings";
import EmployeeDetail from "./pages/EmployeeDetail";
import Holidays from "./pages/Holidays";
import EventRegister from "./pages/EventRegister";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";

import { getRole } from "./utils/auth";

const EmployeeProxy = ({
  component: Component,
  fallbackTab,
}: {
  component: React.ComponentType;
  fallbackTab: "Attendance" | "Leaves" | "Movements" | "Event Register";
}) => {
  if (getRole() === "EMPLOYEE") {
    return <EmployeeDetail forcedTab={fallbackTab} />;
  }
  return <Component />;
};

const ProfileProxy = () => {
  if (getRole() === "EMPLOYEE") {
    return <EmployeeDetail forcedTab="Summary" />;
  }
  return <EmployeeDetail />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — Login */}
        <Route path="/" element={<Login />} />

        {/* All authenticated roles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmployeeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfileProxy />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmployeeProxy
                  component={Attendance}
                  fallbackTab="Attendance"
                />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmployeeProxy component={Leave} fallbackTab="Leaves" />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/movement"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmployeeProxy
                  component={MovementRegister}
                  fallbackTab="Movements"
                />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-register"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HOD", "EMPLOYEE"]}>
              <DashboardLayout>
                <EmployeeProxy
                  component={EventRegister}
                  fallbackTab="Event Register"
                />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN + HOD */}
        <Route
          path="/relieving"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HOD"]}>
              <DashboardLayout>
                <Relieving />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HOD"]}>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN only */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <EmployeeOnboarding />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/holidays"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <Holidays />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HOD", "EMPLOYEE"]}>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
