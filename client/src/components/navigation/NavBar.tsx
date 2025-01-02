import { Link } from "wouter";
import { ThemeToggle } from "../theme/theme-toggle";
import { motion } from "framer-motion";
import { useScroll } from "@/hooks/use-scroll";

export default function NavBar() {
  const scrolled = useScroll();

  return (
    <motion.header
      className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm"
      initial={{ height: 73 }}
      animate={{
        height: scrolled ? 64 : 73,
        boxShadow: scrolled ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-8">
          <motion.div
            className="text-2xl font-bold"
            animate={{
              scale: scrolled ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Data Catalog
            </Link>
          </motion.div>
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
    </motion.header>
  );
}