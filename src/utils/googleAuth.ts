/**
 * Google Identity Services helper.
 * Loads the GIS script dynamically and returns the idToken via a Promise.
 *
 * ⚠️ REPLACE the value below with your actual Google OAuth Client ID
 *    from Google Cloud Console → APIs & Services → Credentials
 */

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

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
            }
          ) => void;
        };
      };
    };
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    // Script tag exists but not yet loaded
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        // loaded but google not available (edge case)
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Triggers the Google sign-in popup and returns the idToken (JWT credential).
 *
 * Uses the One Tap prompt. If the prompt is blocked or dismissed by the browser,
 * falls back to a hidden renderButton click.
 */
export async function getGoogleIdToken(): Promise<string> {
  await loadGoogleScript();

  if (!window.google?.accounts?.id) {
    throw new Error(
      "Google Identity Services not available. Check your internet connection."
    );
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    window.google!.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (settled) return;
        settled = true;
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("No credential received from Google"));
        }
      },
      cancel_on_tap_outside: false,
    });

    // Try One Tap first
    window.google!.accounts.id.prompt((notification) => {
      if (settled) return;

      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap blocked/skipped → fall back to rendered button in a hidden container
        const reason = notification.isNotDisplayed()
          ? notification.getNotDisplayedReason()
          : notification.getSkippedReason();

        console.warn("Google One Tap not displayed, reason:", reason);

        // Create a hidden container, render Google's button, and auto-click it
        let container = document.getElementById("g_id_hidden_btn");
        if (!container) {
          container = document.createElement("div");
          container.id = "g_id_hidden_btn";
          container.style.position = "fixed";
          container.style.top = "-9999px";
          container.style.left = "-9999px";
          document.body.appendChild(container);
        }

        window.google!.accounts.id.renderButton(container, {
          type: "standard",
          size: "large",
        });

        // Auto-click the rendered button after a brief delay
        setTimeout(() => {
          const btn = container?.querySelector(
            'div[role="button"]'
          ) as HTMLElement | null;
          if (btn) {
            btn.click();
          } else {
            if (!settled) {
              settled = true;
              reject(
                new Error(
                  "Google sign-in popup could not be opened. Please check your pop-up blocker settings."
                )
              );
            }
          }
        }, 300);
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Google sign-in timed out. Please try again."));
      }
    }, 60000);
  });
}
