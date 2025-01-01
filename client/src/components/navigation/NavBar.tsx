import { Link } from "wouter";
import { ThemeToggle } from "../theme/theme-toggle";

export default function NavBar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Data Catalog
            </a>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Data Products
              </a>
            </Link>
            <Link href="/metric-definitions">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Metric Definitions
              </a>
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
