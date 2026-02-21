import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="p-3 d-flex justify-content-between align-items-center border-bottom">
        <span>Welcome, {user?.username ?? "User"}</span>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <div className="container">
        this is the home page
      </div>
    </main>
  );
};

export default Home;
