import "./globals.css";
import Navbar from "@/components/Navbar";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

