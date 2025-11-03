import { LogoWithText } from "@/components/ui/logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Link 
        href="/" 
        className="absolute top-6 left-6 hover:opacity-80 transition-opacity z-10"
      >
        <LogoWithText />
      </Link>
      {children}
    </div>
  );
}
