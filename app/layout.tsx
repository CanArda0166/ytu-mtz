import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "@/components/NotificationProvider";

export const metadata: Metadata = {
  title: "T3 Zirve Yönetim Sistemi",
  description: "Türkiye Teknoloji Takımı Vakfı - Zirve Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
