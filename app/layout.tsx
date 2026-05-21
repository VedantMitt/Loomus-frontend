import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { RoomProvider } from "@/context/RoomContext";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata, Viewport } from "next";
import AIAssistant from "@/components/AIAssistant";

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
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <RoomProvider>
            <Navbar />
            {children}
            <MobileNav />
            <AIAssistant />
          </RoomProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
