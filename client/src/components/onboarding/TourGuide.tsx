import { useState, useEffect } from 'react';
import { TourProvider, useTour, type StepType } from '@reactour/tour';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Medal, PartyPopper } from 'lucide-react';

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

// Celebration component
function Celebration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <div className="relative">
        <motion.div
          initial={{ y: 0 }}
          animate={{
            y: [-20, 20],
            transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" }
          }}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16"
        >
          <PartyPopper className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="bg-card p-8 rounded-lg shadow-lg text-center"
        >
          <Medal className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tour Completed! 🎉</h2>
          <p className="text-muted-foreground">
            You're now ready to explore the platform
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Tour progress tracking hook
export function useTourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { setIsOpen: setTourOpen, setCurrentStep, currentStep } = useTour();
  const { toast } = useToast();

  // Check if it's the user's first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setIsOpen(true);
      localStorage.setItem('tourProgress', '0');
    }
  }, []);

  // Track progress
  useEffect(() => {
    if (currentStep !== undefined) {
      localStorage.setItem('tourProgress', currentStep.toString());
    }
  }, [currentStep]);

  const startTour = () => {
    setIsOpen(true);
    setTourOpen(true);
    const lastProgress = parseInt(localStorage.getItem('tourProgress') || '0');
    setCurrentStep(lastProgress);
  };

  const endTour = () => {
    setIsOpen(false);
    setTourOpen(false);
    localStorage.setItem('tourProgress', '0'); // Reset progress on completion
    const hasSeenTour = localStorage.getItem('hasSeenTour');

    if (!hasSeenTour) {
      localStorage.setItem('hasSeenTour', 'true');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }

    toast({
      title: "Tour Completed! 🎉",
      description: "You can always restart the tour from the help menu.",
    });
  };

  return {
    isOpen,
    startTour,
    endTour,
    showCelebration,
  };
}

// Tour Provider Component
interface TourGuideProviderProps {
  children: React.ReactNode;
}

export function TourGuideProvider({ children }: TourGuideProviderProps) {
  const { endTour, showCelebration } = useTourGuide();

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
        dot: (base, { current }) => ({
          ...base,
          background: current ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
          width: 8,
          height: 8,
          margin: '0 4px',
        }),
      }}
      padding={16}
      onClickMask={() => endTour()}
      onClickClose={() => endTour()}
      afterClose={() => endTour()}
      lastStepNextButton={<Button>Finish Tour</Button>}
    >
      {children}
      <AnimatePresence>
        {showCelebration && <Celebration />}
      </AnimatePresence>
    </TourProvider>
  );
}

// Tour Start Button Component
export function TourStartButton() {
  const { startTour } = useTourGuide();
  const tourProgress = parseInt(localStorage.getItem('tourProgress') || '0');
  const totalSteps = tourSteps.length;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="fixed bottom-4 right-4 z-50 gap-2"
    >
      {tourProgress > 0 && tourProgress < totalSteps ? (
        <>
          Continue Tour ({tourProgress}/{totalSteps})
        </>
      ) : (
        'Start Tour'
      )}
    </Button>
  );
}