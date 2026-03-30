import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "CampusConnect",
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
          <Navbar />
          {children}
          <MobileNav />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
