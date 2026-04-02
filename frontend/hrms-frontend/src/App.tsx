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
            <ProtectedRoute><DashboardLayout>
              <Dashboard />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Employee Onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute><DashboardLayout>
              <EmployeeOnboarding />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Employee Management */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute><DashboardLayout>
              <EmployeeManagement />
            </DashboardLayout></ProtectedRoute>
          }
        />

        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute><DashboardLayout>
              <EmployeeDetail />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Attendance */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute><DashboardLayout>
              <Attendance />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Leave */}
        <Route
          path="/leave"
          element={
            <ProtectedRoute><DashboardLayout>
              <Leave />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Relieving */}
        <Route
          path="/relieving"
          element={
            <ProtectedRoute><DashboardLayout>
              <Relieving />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Movement Register */}
        <Route
          path="/movement"
          element={
            <ProtectedRoute><DashboardLayout>
              <MovementRegister />
            </DashboardLayout></ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute><DashboardLayout>
              <Settings />
            </DashboardLayout></ProtectedRoute>
          }
        />

        <Route
          path="/holidays"
          element={
            <ProtectedRoute><DashboardLayout>
              <Holidays />
            </DashboardLayout></ProtectedRoute>
          }
        />

        <Route
          path="/event-register"
          element={
            <ProtectedRoute><DashboardLayout>
              <EventRegister />
            </DashboardLayout></ProtectedRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <ProtectedRoute><DashboardLayout>
              <Reports />
            </DashboardLayout></ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
