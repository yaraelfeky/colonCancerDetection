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
    </Routes>
  );
};

export default App;
