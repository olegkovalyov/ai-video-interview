import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AI Video Interview - Smart Hiring Platform",
  description: "AI-powered video interview platform with real-time analysis and comprehensive candidate evaluation",
};

/**
 * BULLETPROOF AUTH - Root Layout
 * 
 * Включает TokenRefreshProvider для proactive обновления токенов
 * Токены обновляются каждые 4 минуты (до истечения 5-минутного access_token)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TokenRefreshProvider>
          {children}
        </TokenRefreshProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
