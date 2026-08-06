"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/", "/auth/login", "/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith("/auth/"));
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!isPublic && !token) {
        setIsAuthenticated(false);
        window.location.replace("/auth/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, [pathname]);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith("/auth/"));
  if (!isPublic && isAuthenticated === false) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#666", fontSize: "14px", fontFamily: "sans-serif" }}>Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}
