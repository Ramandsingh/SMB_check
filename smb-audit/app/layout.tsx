import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMB Audit — Joinery Business Assessment",
  description: "Business lending assessment tool for joinery businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
