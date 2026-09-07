import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EaseMyOffice KYC Verification",
  description:
    "Complete your EaseMyOffice KYC to activate your virtual office service.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
