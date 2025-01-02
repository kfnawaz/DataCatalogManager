import { useState, useEffect, createContext, useContext } from 'react';
import { TourProvider as BaseTourProvider, useTour, type StepType } from '@reactour/tour';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Medal, PartyPopper } from 'lucide-react';

// Define tour steps
const tourSteps: StepType[] = [
  {
    selector: '.search-bar',
    content: 'Start by searching for a data product using the search bar. You can find products by name, owner, or tags.',
    position: 'bottom',
  },
  {
    selector: '.metadata-tab',
    content: 'View and manage detailed metadata information about your data products here.',
    position: 'bottom',
  },
  {
    selector: '.lineage-tab',
    content: 'Explore data lineage to understand relationships and dependencies between data products.',
    position: 'bottom',
  },
  {
    selector: '.quality-tab',
    content: 'Monitor data quality metrics and track trends over time.',
    position: 'bottom',
  },
  {
    selector: '.comment-section',
    content: 'Collaborate with your team by adding comments and reactions to discuss data products.',
    position: 'bottom',
  },
];

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

// Create a context to manage tour state globally
const TourContext = createContext<{
  startTour: () => void;
  endTour: () => void;
  isOpen: boolean;
  showCelebration: boolean;
}>({
  startTour: () => {},
  endTour: () => {},
  isOpen: false,
  showCelebration: false,
});

export function useTourGuide() {
  return useContext(TourContext);
}

interface TourGuideProviderProps {
  children: React.ReactNode;
}

export function TourGuideProvider({ children }: TourGuideProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      localStorage.setItem('tourProgress', '0');
    }
  }, []);

  const startTour = () => {
    const lastProgress = parseInt(localStorage.getItem('tourProgress') || '0');
    setCurrentStep(lastProgress);
    setIsOpen(true);
  };

  const endTour = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
    localStorage.setItem('tourProgress', '0');
    setShowCelebration(true);

    setTimeout(() => {
      setShowCelebration(false);
    }, 5000);

    toast({
      title: "Tour Completed! 🎉",
      description: "You can always restart the tour from the help menu.",
    });
  };

  const tourContextValue = {
    startTour,
    endTour,
    isOpen,
    showCelebration,
  };

  return (
    <TourContext.Provider value={tourContextValue}>
      <BaseTourProvider
        steps={tourSteps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          if (currentStep === tourSteps.length - 1) {
            endTour();
          } else {
            localStorage.setItem('tourProgress', currentStep.toString());
          }
        }}
        styles={{
          popover: (base) => ({
            ...base,
            '--reactour-accent': 'hsl(var(--primary))',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            maxWidth: '320px',
          }),
          badge: (base) => ({
            ...base,
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }),
          controls: (base) => ({
            ...base,
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
          }),
          close: (base) => ({
            ...base,
            color: 'hsl(var(--foreground))',
            right: 8,
            top: 8,
          }),
          dot: (base) => ({
            ...base,
            background: 'hsl(var(--primary))',
            width: 8,
            height: 8,
            margin: '0 4px',
          }),
        }}
        padding={16}
        prevButton={({ currentStep }) => (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const prevStep = (currentStep ?? 0) - 1;
              setCurrentStep(prevStep);
              localStorage.setItem('tourProgress', prevStep.toString());
            }}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
        )}
        nextButton={({ currentStep, stepsLength }) => {
          const isLastStep = (currentStep ?? 0) === stepsLength - 1;
          return (
            <Button
              size="sm"
              onClick={() => {
                if (isLastStep) {
                  endTour();
                } else {
                  setCurrentStep((s) => {
                    const nextStep = (s ?? 0) + 1;
                    localStorage.setItem('tourProgress', nextStep.toString());
                    return nextStep;
                  });
                }
              }}
            >
              {isLastStep ? 'Finish Tour' : 'Next'}
            </Button>
          );
        }}
      >
        {children}
        <AnimatePresence>
          {showCelebration && <Celebration />}
        </AnimatePresence>
      </BaseTourProvider>
    </TourContext.Provider>
  );
}

export function TourStartButton() {
  const { startTour, isOpen } = useTourGuide();
  const tourProgress = parseInt(localStorage.getItem('tourProgress') || '0');
  const totalSteps = tourSteps.length;

  // Only hide the button when the tour is actually being shown
  if (isOpen && tourProgress < totalSteps) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="fixed bottom-4 right-4 z-50 gap-2"
    >
      {tourProgress > 0 && tourProgress < totalSteps ? (
        <>Continue Tour ({tourProgress}/{totalSteps})</>
      ) : (
        'Start Tour'
      )}
    </Button>
  );
}