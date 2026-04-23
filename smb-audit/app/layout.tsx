import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMB Audit Tool by Raman",
  description: "Business lending assessment tool by Raman",
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
