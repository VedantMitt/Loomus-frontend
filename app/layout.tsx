import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import PullToRefresh from "@/components/PullToRefresh";
import AuthGuard from "@/components/AuthGuard";
import { RoomProvider } from "@/context/RoomContext";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Loomus",
  description: "Connect with your campus community",
  applicationName: "Loomus",
  appleWebApp: {
    capable: true,
    title: "Loomus",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "179896098236-k92cj68fkliirf291ruuu6sk6rp1e7q4.apps.googleusercontent.com"}>
          <RoomProvider>
            <AuthGuard>
              <Navbar />
              <PullToRefresh>
                {children}
              </PullToRefresh>
              <MobileNav />
            </AuthGuard>
          </RoomProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
