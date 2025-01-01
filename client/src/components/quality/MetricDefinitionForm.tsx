import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const metricSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  query: z.string().min(1, "Query is required"),
  threshold: z.number().optional(),
});

type MetricForm = z.infer<typeof metricSchema>;

interface MetricDefinitionFormProps {
  dataProductId: number;
  onSuccess?: () => void;
}

export default function MetricDefinitionForm({ dataProductId, onSuccess }: MetricDefinitionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MetricForm>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      name: "",
      description: "",
      query: "",
      threshold: undefined,
    },
  });

  const createMetric = useMutation({
    mutationFn: async (data: MetricForm) => {
      const response = await fetch("/api/metric-definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dataProductId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Metric definition created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-metrics", dataProductId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: MetricForm) => {
    createMetric.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter metric name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter metric description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Query</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter SQL query to calculate the metric" 
                  className="font-mono"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="threshold"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Threshold (optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter threshold value"
                  onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={createMetric.isPending}
          className="w-full"
        >
          {createMetric.isPending ? "Creating..." : "Create Metric"}
        </Button>
      </form>
    </Form>
  );
}