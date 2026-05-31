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
        w-full rounded-2xl p-[5px]
        bg-white border border-slate-200
        shadow-sm transition-all duration-300
        hover:-translate-y-0.5
        hover:shadow-md google-credential-btn-wrap ${isDisabled ? "google-credential-btn-wrap--disabled" : ""}`}
      aria-busy={busy}
    >
      <div className="google-credential-btn-fallback" aria-hidden={!isDisabled}>
        <span>G</span>
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
          width="100%"
          // locale="en"
        />
      </div>
    </div>
  );
};

export default GoogleCredentialButton;
