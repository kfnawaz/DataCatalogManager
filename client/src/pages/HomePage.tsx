import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/search/SearchBar";

export default function HomePage() {
  const [, setLocation] = useLocation();

  const handleSelect = (productId: number) => {
    setLocation(`/dashboard?product=${productId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)]">
      <div className="max-w-3xl w-full px-4 text-center space-y-6 -mt-20">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Enterprise Data Catalog
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Your centralized hub for data product discovery, quality assessment, and infrastructure optimization
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <SearchBar onSelect={handleSelect} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Data Discovery</h3>
            <p className="text-muted-foreground">Find and explore data products across your organization</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Quality Assessment</h3>
            <p className="text-muted-foreground">Monitor and maintain data quality standards</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Infrastructure Insights</h3>
            <p className="text-muted-foreground">Optimize your data infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
}