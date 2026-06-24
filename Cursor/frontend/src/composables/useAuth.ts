import { ref, computed } from "vue";

const TOKEN_KEY = "ontology_access_token";
const USER_KEY = "ontology_user";

export function useAuth() {
  const token = ref<string | null>(sessionStorage.getItem(TOKEN_KEY));
  const rawUser = sessionStorage.getItem(USER_KEY);
  const user = ref<{ username?: string; role?: string } | null>(
    rawUser
      ? (() => {
          try {
            return JSON.parse(rawUser) as { username?: string; role?: string };
          } catch {
            return null;
          }
        })()
      : null
  );

  const isAuthenticated = computed(() => Boolean(token.value));

  function setSession(accessToken: string, u: { username?: string; role?: string }) {
    token.value = accessToken;
    user.value = u;
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  function logout() {
    token.value = null;
    user.value = null;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function authHeaders(): Record<string, string> {
    const h: Record<string, string> = {};
    if (token.value) {
      h["Authorization"] = `Bearer ${token.value}`;
    }
    return h;
  }

  return {
    token,
    user,
    isAuthenticated,
    setSession,
    logout,
    authHeaders,
  };
}
