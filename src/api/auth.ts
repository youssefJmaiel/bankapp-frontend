import Keycloak from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

if (!keycloakUrl || !realm || !clientId) {
  console.error(
    '[auth] Keycloak environment variables are missing. Set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID'
  );
}

export const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: realm,
  clientId: clientId,
});

let initialized = false;

export interface AuthUserInfo {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

export async function initAuth(): Promise<boolean> {
  if (initialized) {
    return keycloak.authenticated ?? false;
  }

  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    initialized = true;
    return authenticated;
  } catch (err) {
    console.error('[auth] Keycloak init failed', err);
    initialized = true;
    return false;
  }
}

export async function login(): Promise<void> {
  await keycloak.login({
    redirectUri: window.location.origin + '/dashboard',
  });
}

export async function logout(): Promise<void> {
  try {
    await keycloak.logout({
      redirectUri: window.location.origin + '/login',
    });
  } catch (error) {
    console.error('[auth] Keycloak logout failed', error);
    keycloak.clearToken();
    window.location.href = '/login';
  }
}

export function getToken(): string | undefined {
  return keycloak.token;
}

export async function updateTokenIfNeeded(): Promise<boolean> {
  if (!keycloak.authenticated) {
    return false;
  }

  try {
    const refreshed = await keycloak.updateToken(30);

    if (refreshed) {
      console.debug('[auth] Token refreshed');
    }

    return true;
  } catch {
    console.warn('[auth] Token refresh failed — user will be logged out');
    await logout();
    return false;
  }
}

export function isAuthenticated(): boolean {
  return keycloak.authenticated ?? false;
}

export function getCurrentUser(): AuthUserInfo | null {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return null;
  }

  const tp = keycloak.tokenParsed as Record<string, unknown>;

  const preferredUsername =
    (tp['preferred_username'] as string) ?? '';

  const email =
    (tp['email'] as string) ?? '';

  const givenName =
    (tp['given_name'] as string) ?? '';

  const familyName =
    (tp['family_name'] as string) ?? '';

  const fullName =
    givenName && familyName
      ? `${givenName} ${familyName}`
      : preferredUsername;

  const realmAccess =
    tp['realm_access'] as { roles?: string[] } | undefined;

  const resourceAccess =
    tp['resource_access'] as
      | Record<string, { roles?: string[] }>
      | undefined;

  const clientAccess =
    resourceAccess?.[clientId];

  const roles = [
    ...(realmAccess?.roles ?? []),
    ...(clientAccess?.roles ?? []),
  ];

  return {
    username: preferredUsername,
    email,
    firstName: givenName,
    lastName: familyName,
    fullName,
    roles,
  };
}
