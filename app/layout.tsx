import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import PullToRefresh from "@/components/PullToRefresh";
import { RoomProvider } from "@/context/RoomContext";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Loomus",
  description: "Connect with your campus community",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
            <Navbar />
            <PullToRefresh>
              {children}
            </PullToRefresh>
            <MobileNav />
          </RoomProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
