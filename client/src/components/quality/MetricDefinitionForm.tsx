import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const metricDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["completeness", "accuracy", "timeliness", "consistency", "uniqueness", "validity"]),
  templateId: z.string().optional(),
  formula: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

type MetricDefinitionForm = z.infer<typeof metricDefinitionSchema>;

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  defaultFormula: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
  }>;
  example?: string;
  tags?: string[];
}

export default function MetricDefinitionForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/metric-templates"],
  });

  const form = useForm<MetricDefinitionForm>({
    resolver: zodResolver(metricDefinitionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "completeness",
      formula: "",
      parameters: {},
    },
  });

  const createMetricMutation = useMutation({
    mutationFn: async (data: MetricDefinitionForm) => {
      const response = await fetch("/api/metric-definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metric-definitions"] });
      toast({
        title: "Success",
        description: "Metric definition created successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === parseInt(templateId));
    if (template) {
      form.setValue("type", template.type as any);
      form.setValue("formula", template.defaultFormula);
      form.setValue("parameters", {});
    } else {
      form.setValue("formula", "");
      form.setValue("parameters", {});
    }
  };

  function onSubmit(data: MetricDefinitionForm) {
    createMetricMutation.mutate(data);
  }

  const selectedTemplate = templates?.find(
    t => t.id === parseInt(form.watch("templateId") || "0")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template (Optional)</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  onTemplateSelect(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="custom">Custom Metric</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Start with a template or create a custom metric
              </FormDescription>
            </FormItem>
          )}
        />

        {selectedTemplate && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm font-medium">{selectedTemplate.description}</p>
              {selectedTemplate.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="mr-1">
                  {tag}
                </Badge>
              ))}
              {selectedTemplate.example && (
                <p className="text-sm text-muted-foreground">
                  Example: {selectedTemplate.example}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Metric name" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this metric measures"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="completeness">Completeness</SelectItem>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="timeliness">Timeliness</SelectItem>
                  <SelectItem value="consistency">Consistency</SelectItem>
                  <SelectItem value="uniqueness">Uniqueness</SelectItem>
                  <SelectItem value="validity">Validity</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The category this metric belongs to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="formula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formula</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="SQL or calculation formula for this metric"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {selectedTemplate ? 
                  "Customize the template formula if needed" : 
                  "How this metric should be calculated"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createMetricMutation.isPending}>
          {createMetricMutation.isPending ? "Creating..." : "Create Metric"}
        </Button>
      </form>
    </Form>
  );
}