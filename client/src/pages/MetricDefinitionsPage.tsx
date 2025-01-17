import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import MetricDefinitionForm from "../components/quality/MetricDefinitionForm";
import MetricDefinitionList from "../components/quality/MetricDefinitionList";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function MetricDefinitionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  // Add keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N to open create modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
        toast({
          description: "Create new metric definition (Ctrl/Cmd + N)",
          duration: 1500,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Metric Definitions</h1>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="relative group"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Metric
          <span className="absolute hidden group-hover:inline-block bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap mb-2">
            Press Ctrl/Cmd + N
          </span>
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

      <AnimatePresence>
        <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <SheetContent 
            side="right" 
            className="w-[60%] sm:max-w-[60%] animate-in slide-in-from-right duration-300"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
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
            </motion.div>
          </SheetContent>
        </Sheet>
      </AnimatePresence>
    </div>
  );
}