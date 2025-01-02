import { Link } from "wouter";
import { ThemeToggle } from "../theme/theme-toggle";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-bold">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Data Catalog
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/data-products" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Data Products
            </Link>
            <Link href="/metric-definitions" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Metric Definitions
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}