/** CRA: set REACT_APP_GOOGLE_CLIENT_ID in .env */
export function getGoogleClientId(): string {
  return (
    process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim() ||
    "690273413989-16q3r238oskk9iqvg1ar9vjcd81ks08m.apps.googleusercontent.com"
  );
}

export function assertGoogleClientId(): void {
  if (!getGoogleClientId()) {
    throw new Error(
      "Google sign-in is not configured. Set REACT_APP_GOOGLE_CLIENT_ID in your .env file."
    );
  }
}
