import Link from "next/link"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  currentPage?: string
}

export function Header({ currentPage }: HeaderProps) {
  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎥</span>
            <span className="text-xl font-bold text-white">
              AI Video Interview
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/about" 
              className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                currentPage === 'about' ? 'text-yellow-400' : ''
              }`}
            >
              About
            </Link>
            <Link 
              href="/pricing" 
              className={`text-white hover:text-yellow-400 transition-colors font-medium ${
                currentPage === 'pricing' ? 'text-yellow-400' : ''
              }`}
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Button asChild variant="glass" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
