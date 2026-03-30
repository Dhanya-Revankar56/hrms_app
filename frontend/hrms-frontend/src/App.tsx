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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        {/* Employee Onboarding */}
        <Route
          path="/onboarding"
          element={
            <DashboardLayout>
              <EmployeeOnboarding />
            </DashboardLayout>
          }
        />

        {/* Employee Management */}
        <Route
          path="/employees"
          element={
            <DashboardLayout>
              <EmployeeManagement />
            </DashboardLayout>
          }
        />

        <Route
          path="/employees/:id"
          element={
            <DashboardLayout>
              <EmployeeDetail />
            </DashboardLayout>
          }
        />

        {/* Attendance */}
        <Route
          path="/attendance"
          element={
            <DashboardLayout>
              <Attendance />
            </DashboardLayout>
          }
        />

        {/* Leave */}
        <Route
          path="/leave"
          element={
            <DashboardLayout>
              <Leave />
            </DashboardLayout>
          }
        />

        {/* Relieving */}
        <Route
          path="/relieving"
          element={
            <DashboardLayout>
              <Relieving />
            </DashboardLayout>
          }
        />

        {/* Movement Register */}
        <Route
          path="/movement"
          element={
            <DashboardLayout>
              <MovementRegister />
            </DashboardLayout>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          }
        />
  // testing husky 

        <Route
          path="/holidays"
          element={
            <DashboardLayout>
              <Holidays />
            </DashboardLayout>
          }
        />

        <Route
          path="/event-register"
          element={
            <DashboardLayout>
              <EventRegister />
            </DashboardLayout>
          }
        />
        
        <Route
          path="/reports"
          element={
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
