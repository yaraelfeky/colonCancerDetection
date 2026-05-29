
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
// import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getGoogleClientId } from "./utils/googleClientId";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const googleClientId = getGoogleClientId();

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <App />
        </GoogleOAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
