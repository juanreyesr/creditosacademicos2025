export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/logo-colegio.png";

// Colores institucionales del Colegio de Psicólogos de Guatemala
export const COLORS = {
  primary: "#2B2E5F", // Azul oscuro/morado
  secondary: "#D91C7A", // Rosa/Magenta
  accent: "#F5A623", // Naranja/Amarillo
  purple: "#4A2C5B", // Morado oscuro
  green: "#7AC143", // Verde
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
