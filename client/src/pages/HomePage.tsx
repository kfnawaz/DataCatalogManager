import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "@/components/search/SearchBar";

export default function HomePage() {
  const navigate = useNavigate();

  const handleSelect = (productId: number) => {
    navigate(`/data-products?product=${productId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)]">
      <div className="max-w-3xl w-full px-4 text-center space-y-8 -mt-32">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Enterprise Data Catalog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your centralized hub for data product discovery, quality assessment, and infrastructure optimization
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <SearchBar onSelect={handleSelect} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Data Discovery</h3>
            <p className="text-muted-foreground">Find and explore data products across your organization</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Quality Assessment</h3>
            <p className="text-muted-foreground">Monitor and maintain data quality standards</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Infrastructure Insights</h3>
            <p className="text-muted-foreground">Optimize your data infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
}