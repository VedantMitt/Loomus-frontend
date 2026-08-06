export const logout = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.clear();
      // Clear cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      window.dispatchEvent(new Event("auth-change"));
    } catch (e) {
      console.error("Error during logout:", e);
    }
    // Hard redirect to login to wipe all in-memory React state and socket connections
    window.location.replace("/auth/login");
  }
};

export const setAuth = (token: string, user: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    document.cookie = `token=${token}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event("auth-change"));
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getStoredUser = (): any | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
