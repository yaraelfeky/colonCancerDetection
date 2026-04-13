// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { ProtectedRoute } from "./components/ProtectedRoute";
// import LoginPage from "./pages/auth/login";
// import RegisterPage from "./pages/auth/register";
// import Home from "./pages/Home/Home";

// const App: React.FC = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<Navigate to="/login" replace />} />
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<RegisterPage />} />
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <Home />
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// };

// export default App;

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import Home from "./pages/Home/Home";
import { DoctorRoute } from "./components/DoctorRoute";
import DoctorProfileDashboard from "./pages/doctor/DoctorProfileDashboard";
import NotificationsPage from "./pages/NotificationsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

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
        path="/appointment"
        element={
          <ProtectedRoute>
            <div>Appointment page (coming soon)</div>
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
            <div>Report History page (coming soon)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <div>Settings page (coming soon)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute>
            <DoctorRoute>
              <DoctorProfileDashboard />
            </DoctorRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
