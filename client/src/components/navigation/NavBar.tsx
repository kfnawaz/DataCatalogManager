import { Link } from "wouter";
import { ThemeToggle } from "../theme/theme-toggle";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function NavBar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  // Transform navbar background opacity and scale based on scroll
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(var(--background-rgb), 0.5)", "rgba(var(--background-rgb), 0.98)"]
  );

  const scale = useTransform(
    scrollY,
    [0, 50],
    [1, 0.98]
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
      className={`sticky top-0 z-50 border-b backdrop-blur-[12px] transition-all duration-300 ease-in-out ${
        isScrolled ? "shadow-lg" : "shadow-none"
      }`}
      style={{ backgroundColor, scale }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 20,
        duration: 0.3
      }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-bold">
            <Link 
              href="/" 
              className="text-foreground hover:text-primary/90 transition-colors duration-200"
            >
              Data Catalog
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/data-products" 
              className="text-sm font-medium text-muted-foreground hover:text-primary/90 dark:hover:text-primary/90 transition-all duration-200 hover:scale-105"
            >
              Data Products
            </Link>
            <Link 
              href="/metric-definitions" 
              className="text-sm font-medium text-muted-foreground hover:text-primary/90 dark:hover:text-primary/90 transition-all duration-200 hover:scale-105"
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