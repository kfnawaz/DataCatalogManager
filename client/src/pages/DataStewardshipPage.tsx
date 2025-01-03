import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataStewardDashboard from "@/components/dashboard/DataStewardDashboard";

export default function DataStewardshipPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Stewardship Dashboard</h1>
      </div>
      <DataStewardDashboard />
    </div>
  );
}
