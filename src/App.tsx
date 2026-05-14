import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import VerificationPage from "./pages/auth/VerificationPage";
import Home from "./pages/Home/Home";
import { DoctorRoute } from "./components/DoctorRoute";
import DoctorProfileDashboard from "./pages/doctor/DoctorProfileDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import DoctorAppointmentDashboardPage from "./pages/doctor/DoctorAppointmentDashboard";
import ReportHistoryPage from "./pages/doctor/ReportHistoryPage";
import AdminDoctorsManagementPage from "./pages/admin/AdminDoctorsManagementPage";
import { AdminRoute } from "./components/AdminRoute";
import SettingsPage from "./pages/SettingsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerificationPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute> 
        }
      />

      {/* Services pages (empty for now) */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <div>Patient page (coming soon)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <DoctorAppointmentDashboardPage/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ManagementPage"
        element={
          <ProtectedRoute>
            <AdminDoctorsManagementPage/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <ReportHistoryPage />
            </DoctorRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <DoctorProfileDashboard />
            </DoctorRoute>
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute>
            <DoctorProfileDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDoctorsManagementPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
