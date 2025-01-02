import { Link } from "wouter";
import { ThemeToggle } from "../theme/theme-toggle";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function NavBar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  // Transform navbar background opacity based on scroll
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(var(--background-rgb), 0.8)", "rgba(var(--background-rgb), 0.95)"]
  );

  // Update scroll state for mobile
  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", updateScrollState);
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-50 border-b backdrop-blur-sm transition-all duration-200 ${
        isScrolled ? "shadow-sm" : ""
      }`}
      style={{ backgroundColor }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-bold">
            <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200">
              Data Catalog
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/data-products" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Data Products
            </Link>
            <Link 
              href="/metric-definitions" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Metric Definitions
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </motion.header>
  );
}