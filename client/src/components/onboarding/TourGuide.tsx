import { useState, useEffect } from 'react';
import { TourProvider, useTour, type StepType } from '@reactour/tour';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Define tour steps
const tourSteps: StepType[] = [
  {
    selector: '.search-bar',
    content: 'Start by searching for a data product using the search bar. You can find products by name, owner, or tags.',
  },
  {
    selector: '.metadata-tab',
    content: 'View and manage detailed metadata information about your data products here.',
  },
  {
    selector: '.lineage-tab',
    content: 'Explore data lineage to understand relationships and dependencies between data products.',
  },
  {
    selector: '.quality-tab',
    content: 'Monitor data quality metrics and track trends over time.',
  },
  {
    selector: '.comment-section',
    content: 'Collaborate with your team by adding comments and reactions to discuss data products.',
  },
];

// Tour state management hook
export function useTourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsOpen: setTourOpen, setCurrentStep } = useTour();
  const { toast } = useToast();

  // Check if it's the user's first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setIsOpen(true);
      localStorage.setItem('hasSeenTour', 'true');
    }
  }, []);

  const startTour = () => {
    setIsOpen(true);
    setTourOpen(true);
    setCurrentStep(0);
  };

  const endTour = () => {
    setIsOpen(false);
    setTourOpen(false);
    toast({
      title: "Tour Completed! 🎉",
      description: "You can always restart the tour from the help menu.",
    });
  };

  return {
    isOpen,
    startTour,
    endTour,
  };
}

// Tour Provider Component
interface TourGuideProviderProps {
  children: React.ReactNode;
}

export function TourGuideProvider({ children }: TourGuideProviderProps) {
  return (
    <TourProvider
      steps={tourSteps}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': 'hsl(var(--primary))',
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          borderRadius: 'var(--radius)',
          padding: '1rem',
        }),
        badge: (base) => ({
          ...base,
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        }),
        controls: (base) => ({
          ...base,
          marginTop: '1rem',
        }),
        close: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
          right: 8,
          top: 8,
        }),
      }}
      padding={16}
      onClickMask={({ setIsOpen }) => {
        setIsOpen(false);
      }}
    >
      {children}
    </TourProvider>
  );
}

// Tour Start Button Component
export function TourStartButton() {
  const { startTour } = useTourGuide();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="fixed bottom-4 right-4 z-50"
    >
      Start Tour
    </Button>
  );
}
