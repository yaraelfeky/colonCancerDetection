import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../Context/AuthContext";
import { getAxiosErrorMessage } from "../utils/axiosError";
import {
  parseGoogleLoginResultDto,
  requiresGoogleDoctorRegistration,
  resolveGoogleLoginFlow,
  type GoogleLoginFlowAction,
} from "../utils/googleLoginFlow";

type GoogleAuthErrors = { submit?: string };

function routeGoogleLoginAction(
  action: GoogleLoginFlowAction,
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>
): void {
  switch (action.type) {
    case "REQUIRES_REGISTRATION":
      navigate("/verify", {
        state: { googleIdToken: action.idToken },
      });
      return;
    case "PENDING_APPROVAL":
      navigate("/login", {
        replace: true,
        state: { successMessage: action.message },
      });
      return;
    case "AUTHENTICATED": {
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ??
        "/dashboard";
      navigate(from, { replace: true });
      return;
    }
    default:
      return;
  }
}

/**
 * Shared google-login flow: credential → POST { idToken, isDoctor } → route by response.
 */
export function useGoogleCredentialAuth(
  rememberMe: boolean,
  setErrors: React.Dispatch<React.SetStateAction<GoogleAuthErrors>>,
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
) {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin } = useAuth();

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setErrors({});
      setIsSubmitting(true);
      try {
        const result = await googleLogin({ idToken, isDoctor: true }, rememberMe);
        const action = resolveGoogleLoginFlow(result, idToken);
        routeGoogleLoginAction(action, navigate, location);
      } catch (err) {
        // Fallback: some proxies still surface requiresRegistration only on Axios errors.
        if (err instanceof AxiosError && err.response?.data) {
          const parsed = parseGoogleLoginResultDto(err.response.data);
          if (requiresGoogleDoctorRegistration(parsed)) {
            const action = resolveGoogleLoginFlow(parsed, idToken);
            routeGoogleLoginAction(action, navigate, location);
            return;
          }
        }
        setErrors({ submit: getAxiosErrorMessage(err) });
      } finally {
        setIsSubmitting(false);
      }
    },
    [googleLogin, rememberMe, navigate, location, setErrors, setIsSubmitting]
  );

  return { handleGoogleCredential };
}
