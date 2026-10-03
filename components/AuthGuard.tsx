"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const PUBLIC_ROUTES = ["/", "/auth/login", "/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: any;
    let isMounted = true;
    
    const setup = async () => {
      listener = await App.addListener("backButton", (data) => {
        const currentPath = window.location.pathname;
        if (
          currentPath === "/" ||
          currentPath === "/auth/login" ||
          currentPath === "/onboarding"
        ) {
          App.exitApp();
        } else {
          router.back();
        }
      });

      // In case the component unmounted while the promise was resolving
      if (!isMounted && listener) {
        listener.remove();
      }
    };
    
    setup();

    return () => {
      isMounted = false;
      if (listener) listener.remove();
    };
  }, [router]);

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
