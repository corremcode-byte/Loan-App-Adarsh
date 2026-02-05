import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loan Application Portal",
  description: "Apply for personal and secured loans with easy online process",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
