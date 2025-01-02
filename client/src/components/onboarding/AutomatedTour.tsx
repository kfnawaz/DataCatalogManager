import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  Search,
  LayoutDashboard,
  GitGraph,
  BarChart3,
  MessageSquare
} from 'lucide-react';

const tourSteps = [
  {
    selector: '.search-bar',
    title: 'Search Products',
    description: 'Start by searching for a data product using the search bar.',
    icon: <Search className="h-5 w-5" />,
    route: '/data-products'
  },
  {
    selector: '.metadata-tab',
    title: 'Product Metadata',
    description: 'View and manage detailed metadata information about your data products.',
    icon: <LayoutDashboard className="h-5 w-5" />,
    route: '/data-products'
  },
  {
    selector: '.lineage-tab',
    title: 'Data Lineage',
    description: 'Explore data lineage to understand relationships between products.',
    icon: <GitGraph className="h-5 w-5" />,
    route: '/data-products'
  },
  {
    selector: '.quality-tab',
    title: 'Quality Metrics',
    description: 'Monitor data quality metrics and track trends over time.',
    icon: <BarChart3 className="h-5 w-5" />,
    route: '/data-products'
  },
  {
    selector: '.comment-section',
    title: 'Collaboration',
    description: 'Add comments and reactions to discuss data products with your team.',
    icon: <MessageSquare className="h-5 w-5" />,
    route: '/data-products'
  }
];

export function AutomatedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if this is the first visit and start tour automatically
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      console.log('First visit detected, starting tour...');
      setIsVisible(true);
      navigateToStep(0);
    }
  }, []);

  const navigateToStep = (stepIndex: number) => {
    console.log(`Navigating to step ${stepIndex + 1} of ${tourSteps.length}`);
    const step = tourSteps[stepIndex];

    // Navigate to the correct route if needed
    if (step.route && window.location.pathname !== step.route) {
      console.log(`Navigating to route: ${step.route}`);
      setLocation(step.route);
    }

    // Wait for navigation and DOM update
    setTimeout(() => {
      const element = document.querySelector(step.selector);
      if (element) {
        console.log(`Found element for selector: ${step.selector}`);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.log(`Element not found for selector: ${step.selector}`);
      }
    }, 500);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStepIndex = currentStep + 1;
      console.log(`Moving to next step: ${nextStepIndex + 1}`);
      setCurrentStep(nextStepIndex);
      navigateToStep(nextStepIndex);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    console.log('Completing tour...');
    setIsVisible(false);
    localStorage.setItem('hasSeenTour', 'true');
    toast({
      title: "Tour Completed!",
      description: "You can now explore the platform on your own."
    });
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-[320px] shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {tourSteps[currentStep].icon}
              <h3 className="font-semibold">{tourSteps[currentStep].title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {tourSteps[currentStep].description}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === currentStep
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <Button
                size="sm"
                onClick={nextStep}
                className="gap-2"
              >
                {currentStep === tourSteps.length - 1 ? (
                  'Finish'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}