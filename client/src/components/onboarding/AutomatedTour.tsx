import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  LayoutDashboard,
  GitGraph,
  BarChart3,
  MessageSquare,
  PartyPopper
} from 'lucide-react';

const tourSteps = [
  {
    title: 'Welcome to Data Catalog Manager',
    description: "Let's take a quick tour of the platform's key features.",
    icon: <PartyPopper className="h-10 w-10 text-primary" />,
    route: '/'
  },
  {
    title: 'Search Products',
    description: 'Start by searching for a data product using the search bar.',
    icon: <Search className="h-10 w-10 text-primary" />,
    route: '/data-products'
  },
  {
    title: 'Product Metadata',
    description: 'View and manage detailed metadata information about your data products.',
    icon: <LayoutDashboard className="h-10 w-10 text-primary" />,
    route: '/data-products'
  },
  {
    title: 'Data Lineage',
    description: 'Explore data lineage to understand relationships between products.',
    icon: <GitGraph className="h-10 w-10 text-primary" />,
    route: '/data-products'
  },
  {
    title: 'Quality Metrics',
    description: 'Monitor data quality metrics and track trends over time.',
    icon: <BarChart3 className="h-10 w-10 text-primary" />,
    route: '/data-products'
  },
  {
    title: 'Collaboration',
    description: 'Add comments and reactions to discuss data products with your team.',
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    route: '/data-products'
  }
];

export function AutomatedTour() {
  const [showTour, setShowTour] = useState(false);
  const [, setLocation] = useLocation();
  const [api, setApi] = useState<CarouselApi>();
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      const currentStep = api.selectedScrollSnap();
      const step = tourSteps[currentStep];
      if (step.route && window.location.pathname !== step.route) {
        setLocation(step.route);
      }
    });
  }, [api, setLocation]);

  const completeTour = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setShowTour(false);
    toast({
      title: "Tour Completed! 🎉",
      description: "You're now ready to explore the platform.",
    });
  };

  return (
    <Dialog open={showTour} onOpenChange={setShowTour}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Platform Tour</DialogTitle>
        </DialogHeader>
        <Carousel setApi={setApi} className="w-full py-6">
          <CarouselContent>
            {tourSteps.map((step, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col items-center space-y-4 text-center p-6">
                  {step.icon}
                  <h3 className="text-xl font-semibold mt-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <div className="flex justify-end mt-6">
            <Button onClick={completeTour}>
              Skip Tour
            </Button>
          </div>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}