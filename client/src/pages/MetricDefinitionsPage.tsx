import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import MetricDefinitionForm from "../components/quality/MetricDefinitionForm";
import MetricDefinitionList from "../components/quality/MetricDefinitionList";

export default function MetricDefinitionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Metric Definitions</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Metric
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metric Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricDefinitionList />
        </CardContent>
      </Card>

      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent side="right" className="w-[60%] sm:max-w-[60%]">
          <SheetHeader>
            <SheetTitle>Create Metric Definition</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <MetricDefinitionForm 
              onSuccess={() => {
                setIsCreateModalOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}