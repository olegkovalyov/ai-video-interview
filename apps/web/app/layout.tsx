import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: 'AI Video Interview - Smart Hiring Platform',
    template: '%s | AI Video Interview',
  },
  description: 'AI-powered video interview platform with real-time analysis and comprehensive candidate evaluation',
  keywords: ['video interview', 'AI hiring', 'candidate evaluation', 'recruitment platform'],
  openGraph: {
    type: 'website',
    title: 'AI Video Interview - Smart Hiring Platform',
    description: 'AI-powered video interview platform with real-time analysis and comprehensive candidate evaluation',
    siteName: 'AI Video Interview',
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Root Layout
 * 
 * TokenRefreshProvider moved to (app)/layout.tsx for protected routes only
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
