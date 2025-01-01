import { Link } from "wouter";
import { ThemeToggle } from "../theme/theme-toggle";

export default function NavBar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-bold">
            <Link href="/" className="hover:text-primary transition-colors">
              Data Catalog
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/metric-definitions" className="text-sm font-medium hover:text-primary transition-colors">
              Metric Definitions
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}