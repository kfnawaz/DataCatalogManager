import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Award, Target, TrendingUp, Users } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  tips: string[];
  icon: React.ReactNode;
  highlight: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Data Stewardship!",
    description: "As a data steward, you'll play a crucial role in maintaining and improving the quality of our data products. Let's explore your dashboard and learn how to maximize your impact.",
    tips: [
      "Regular engagement with data products helps maintain quality",
      "Set aside time each week for stewardship activities",
      "Join the data steward community to share best practices"
    ],
    icon: <Award className="w-8 h-8 text-primary" />,
    highlight: "header"
  },
  {
    title: "Quality Impact Score",
    description: "Track how your improvements affect data quality across managed products. This score reflects your effectiveness as a data steward.",
    tips: [
      "Review metadata completeness regularly",
      "Validate data accuracy through sampling",
      "Document quality improvements for better tracking",
      "Set up automated quality checks where possible"
    ],
    icon: <Target className="w-8 h-8 text-primary" />,
    highlight: "quality-impact"
  },
  {
    title: "Engagement Score",
    description: "Your community impact matters! This score measures how well you help others understand and use data products effectively.",
    tips: [
      "Respond to comments within 24 hours",
      "Share insights about data usage patterns",
      "Create helpful documentation and examples",
      "Mentor new team members in data best practices"
    ],
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    highlight: "engagement"
  },
  {
    title: "Stewardship Level",
    description: "Level up by consistently improving data quality and engaging with the community. Each level unlocks new achievements and responsibilities!",
    tips: [
      "Complete daily stewardship tasks for steady progress",
      "Aim for quality over quantity in improvements",
      "Share your expertise through community forums",
      "Take on more complex data products as you level up"
    ],
    icon: <Users className="w-8 h-8 text-primary" />,
    highlight: "level"
  }
];

interface StewardshipTutorialProps {
  onComplete: () => void;
}

export function StewardshipTutorial({ onComplete }: StewardshipTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md"
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
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {tutorialSteps[currentStep].title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tutorialSteps[currentStep].description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tips to improve:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      {tutorialSteps[currentStep].tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="flex gap-1">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1 w-6 rounded-full ${
                        index === currentStep ? "bg-primary" : "bg-primary/20"
                      }`}
                      animate={{
                        backgroundColor: index === currentStep ? "rgb(15, 23, 42)" : "rgba(15, 23, 42, 0.2)"
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