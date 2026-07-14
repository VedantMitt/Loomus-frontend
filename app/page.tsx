"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/activities");
    } else {
      router.replace("/auth/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
    </main>
  );
}
