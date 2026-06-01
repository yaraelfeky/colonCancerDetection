import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import VerificationPage from "./pages/auth/VerificationPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import Home from "./pages/Home/Home";
import { DoctorRoute } from "./components/DoctorRoute";
import DoctorProfileDashboard from "./pages/doctor/DoctorProfileDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import ScheduleManagementPage from "./pages/doctor/ScheduleManagementPage";
import ReportHistoryPage from "./pages/doctor/ReportHistoryPage";
import DiagnosisPage from "./pages/doctor/DiagnosisPage";
import PatientsListPage from "./pages/patient/PatientPage";
import AdminDoctorsManagementPage from "./pages/admin/AdminDoctorsManagementPage";
import { AdminRoute } from "./components/AdminRoute";
import SettingsPage from "./pages/SettingsPage";
import MedicalRecordPage from "./pages/medical/MedicalRecordPage";
import PatientHistoryPage from "./pages/history/PatientHistoryPage";
import ContactPage from "./pages/Contact/ContactPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute> 
        }
      />

      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <PatientsListPage />
            </DoctorRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <ScheduleManagementPage />
            </DoctorRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ManagementPage"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDoctorsManagementPage/>
            </AdminRoute>
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
        path="/medical-record"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <MedicalRecordPage />
            </DoctorRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <PatientHistoryPage />
            </DoctorRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnosis"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <DiagnosisPage />
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
      <Route
        path="/contact"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <ContactPage />
            </DoctorRoute>
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
