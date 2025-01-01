import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export interface APIStatusProps {
  onStatusChange?: (isAvailable: boolean) => void;
}

export function APIStatus({ onStatusChange }: APIStatusProps) {
  const [status, setStatus] = useState<'available' | 'limited' | 'unavailable'>('available');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Check API status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          setStatus('unavailable');
          onStatusChange?.(false);
          return;
        }

        const data = await response.json();
        setStatus(data.aiService ? 'available' : 'limited');
        onStatusChange?.(data.aiService);
      } catch (error) {
        setStatus('unavailable');
        onStatusChange?.(false);
      }
      setLastChecked(new Date());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [onStatusChange]);

  if (status === 'available') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <Badge variant="outline" className="text-green-500 border-green-500">
          AI Services Available
        </Badge>
      </div>
    );
  }

  return (
    <Alert variant={status === 'limited' ? 'warning' : 'destructive'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {status === 'limited' ? 'Limited Functionality' : 'Service Unavailable'}
      </AlertTitle>
      <AlertDescription>
        {status === 'limited'
          ? 'AI-powered features are currently unavailable. Basic features continue to work.'
          : 'The service is currently experiencing issues. Please try again later.'}
      </AlertDescription>
    </Alert>
  );
}
