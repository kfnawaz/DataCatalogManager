import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Award, Target, TrendingUp, Users } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Data Stewardship!",
    description: "As a data steward, you'll play a crucial role in maintaining and improving the quality of our data products. Let's explore your dashboard together.",
    icon: <Award className="w-8 h-8 text-primary" />,
    highlight: "header"
  },
  {
    title: "Quality Impact Score",
    description: "Track how your improvements affect data quality. Higher scores mean better data quality across products you manage.",
    icon: <Target className="w-8 h-8 text-primary" />,
    highlight: "quality-impact"
  },
  {
    title: "Engagement Score",
    description: "See how your community engagement helps others. Comments and reactions show your influence.",
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    highlight: "engagement"
  },
  {
    title: "Stewardship Level",
    description: "Level up by improving data quality and engaging with the community. Each level unlocks new achievements!",
    icon: <Users className="w-8 h-8 text-primary" />,
    highlight: "level"
  }
];

export function StewardshipTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Check if tutorial has been completed before
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem("stewardshipTutorialCompleted");
    if (tutorialCompleted) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Mark tutorial as completed
      localStorage.setItem("stewardshipTutorialCompleted", "true");
      setIsVisible(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("stewardshipTutorialCompleted", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <Card className="relative shadow-lg border-primary/20">
          <CardContent className="p-6">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                {tutorialSteps[currentStep].icon}
                <div>
                  <h3 className="font-semibold text-lg">
                    {tutorialSteps[currentStep].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tutorialSteps[currentStep].description}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-1">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1 w-6 rounded-full ${
                        index === currentStep ? "bg-primary" : "bg-primary/20"
                      }`}
                      animate={{
                        backgroundColor: index === currentStep ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.2)"
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSkip}>
                    Skip
                  </Button>
                  <Button onClick={handleNext}>
                    {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
