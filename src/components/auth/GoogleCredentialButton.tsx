import React, { useCallback, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { assertGoogleClientId } from "../../utils/googleClientId";

type GoogleCredentialButtonProps = {
  label: string;
  disabled?: boolean;
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
};

/**
 * Uses @react-oauth/google GoogleLogin — idToken is credentialResponse.credential (JWT).
 */
const GoogleCredentialButton: React.FC<GoogleCredentialButtonProps> = ({
  label,
  disabled = false,
  onCredential,
  onError,
}) => {
  const [busy, setBusy] = useState(false);

  const handleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        onError?.("No credential received from Google.");
        return;
      }

      setBusy(true);
      try {
        await onCredential(idToken);
      } finally {
        setBusy(false);
      }
    },
    [onCredential, onError]
  );

  const handleGoogleError = useCallback(() => {
    onError?.("Google sign-in was cancelled or failed. Please try again.");
  }, [onError]);

  try {
    assertGoogleClientId();
  } catch (e) {
    return (
      <p className="auth-error-msg">
        {e instanceof Error ? e.message : "Google sign-in is not configured."}
      </p>
    );
  }

  const isDisabled = disabled || busy;

  return (
    <div
    
      className={`
        w-full transition-transform duration-300
        hover:-translate-y-0.5
        google-credential-btn-wrap ${isDisabled ? "google-credential-btn-wrap--disabled" : ""}`}
      aria-busy={busy}
    >
      <div className="google-credential-btn-fallback" aria-hidden={!isDisabled}>
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {busy ? "Connecting…" : label}
      </div>
      <div className="google-credential-btn-native">
        <GoogleLogin
          onSuccess={(res) => void handleSuccess(res)}
          onError={handleGoogleError}
          useOneTap={false}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          logo_alignment="left"
          width="100%"
          // locale="en"
        />
      </div>
    </div>
  );
};

export default GoogleCredentialButton;
