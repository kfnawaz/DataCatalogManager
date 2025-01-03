import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataStewardDashboard from "@/components/dashboard/DataStewardDashboard";

export default function DataStewardshipPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DataStewardDashboard />
    </div>
  );
}