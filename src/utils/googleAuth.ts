/**
 * Google Identity Services helper.
 * Uses the Google Sign-In button rendered in a modal overlay to reliably
 * obtain an ID token. This avoids issues with One Tap being blocked by
 * browsers / third-party cookie restrictions.
 *
 * Client ID is read from REACT_APP_GOOGLE_CLIENT_ID in .env
 */

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim() || "690273413989-16q3r238oskk9iqvg1ar9vjcd81ks08m.apps.googleusercontent.com";

function assertGoogleClientId(): void {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    throw new Error(
      "Google sign-in is not configured. Set REACT_APP_GOOGLE_CLIENT_ID in a .env file."
    );
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
            ux_mode?: string;
          }) => void;
          prompt: (
            notification?: (n: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
              shape?: string;
            }
          ) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      const checkLoaded = () => {
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          setTimeout(checkLoaded, 50);
        }
      };
      existing.addEventListener("load", checkLoaded);
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

function createGoogleModal(): {
  modal: HTMLDivElement;
  container: HTMLDivElement;
  cleanup: () => void;
} {
  // Overlay backdrop
  const modal = document.createElement("div");
  modal.id = "google-signin-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    backdrop-filter: blur(4px);
  `;

  // Card
  const card = document.createElement("div");
  card.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 32px 28px 28px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-width: 320px;
    max-width: 400px;
    width: 90vw;
    font-family: 'Inter', -apple-system, sans-serif;
    animation: googleModalIn 0.2s ease;
  `;

  // Inject keyframe animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes googleModalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // Header
  const header = document.createElement("div");
  header.style.cssText = `text-align: center;`;

  const logo = document.createElement("div");
  logo.style.cssText = `
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #1a6e5c 0%, #10b981 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
    font-size: 24px;
  `;
  logo.textContent = "🏥";

  const title = document.createElement("h3");
  title.style.cssText = `
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  `;
  title.textContent = "Continue with Google";

  const subtitle = document.createElement("p");
  subtitle.style.cssText = `
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  `;
  subtitle.textContent = "Sign in securely using your Google account";

  header.appendChild(logo);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Google button container
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    justify-content: center;
    width: 100%;
  `;

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 24px;
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
  `;
  cancelBtn.onmouseenter = () => { cancelBtn.style.background = "#f9fafb"; };
  cancelBtn.onmouseleave = () => { cancelBtn.style.background = "none"; };

  card.appendChild(header);
  card.appendChild(container);
  card.appendChild(cancelBtn);
  modal.appendChild(card);
  document.body.appendChild(modal);

  const cleanup = () => {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    if (style.parentNode) style.parentNode.removeChild(style);
  };

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cleanup();
  });

  return { modal, container, cleanup };
}

/**
 * Opens a Google Sign-In modal and returns the idToken (JWT credential).
 * Uses Google's renderButton API for reliable cross-browser support.
 */
// Track whether Google has been initialized to avoid calling initialize() twice
let _googleInitialized = false;
let _googleCallback: ((response: { credential: string }) => void) | null = null;

export async function getGoogleIdToken(): Promise<string> {
  assertGoogleClientId();
  await loadGoogleScript();

  if (!window.google?.accounts?.id) {
    throw new Error(
      "Google Identity Services not available. Check your internet connection."
    );
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const { container, cleanup } = createGoogleModal();

    const settle = (credential: string | null, err?: Error) => {
      if (settled) return;
      settled = true;
      _googleCallback = null;
      cleanup();

      if (credential) {
        resolve(credential);
      } else {
        reject(err || new Error("Google sign-in was cancelled."));
      }
    };

    // Find the cancel button in the modal and wire it up
    const modal = document.getElementById("google-signin-modal");
    if (modal) {
      const cancelBtn = modal.querySelector("button");
      if (cancelBtn) {
        cancelBtn.onclick = () => settle(null, new Error("Google sign-in was cancelled."));
      }
    }

    // Store callback reference so re-initialize can pick it up
    _googleCallback = (response) => {
      if (response.credential) {
        settle(response.credential);
      } else {
        settle(null, new Error("No credential received from Google."));
      }
    };

    // Always re-initialize to set the latest callback
    _googleInitialized = false;

    if (!_googleInitialized) {
      window.google!.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (_googleCallback) _googleCallback(response);
        },
        cancel_on_tap_outside: false,
        context: "signin",
      });
      _googleInitialized = true;
    }

    // Render the actual Google button
    window.google!.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280,
    });

    // Timeout after 3 minutes
    setTimeout(() => {
      settle(null, new Error("Google sign-in timed out. Please try again."));
    }, 180000);
  });
}
