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

interface MetricDefinition {
  id?: number;
  name: string;
  description: string;
  type: string;
  templateId?: number | null;
  formula?: string;
  parameters: Record<string, string>;
}

const metricDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["completeness", "accuracy", "timeliness", "consistency", "uniqueness", "validity"]),
  templateId: z.string().optional(),
  formula: z.string().optional(),
  parameters: z.record(z.string().min(1, "Parameter value is required")),
  changeMessage: z.string().optional(),
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

interface MetricDefinitionFormProps {
  initialData?: MetricDefinition;
  onSuccess?: () => void;
}

export default function MetricDefinitionForm({ initialData, onSuccess }: MetricDefinitionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/metric-templates"],
  });

  const form = useForm<MetricDefinitionForm>({
    resolver: zodResolver(metricDefinitionSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || "completeness",
      templateId: initialData?.templateId?.toString() || "custom",
      formula: initialData?.formula || "",
      parameters: initialData?.parameters || {},
      changeMessage: "", // Added default value
    },
  });

  const createMetricMutation = useMutation({
    mutationFn: async (data: MetricDefinitionForm) => {
      const url = initialData
        ? `/api/metric-definitions/${initialData.id}`
        : "/api/metric-definitions";

      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          templateId: data.templateId === "custom" ? null : parseInt(data.templateId || "0"),
          changeMessage: initialData ? form.getValues("changeMessage") : undefined,
        }),
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
        description: `Metric definition ${initialData ? "updated" : "created"} successfully`,
      });
      form.reset();
      onSuccess?.();
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
      const initialParameters = Object.keys(template.parameters).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {} as Record<string, string>);
      form.setValue("parameters", initialParameters);
    } else {
      form.setValue("formula", "");
      form.setValue("parameters", {});
    }
  };

  function onSubmit(data: MetricDefinitionForm) {
    const template = templates?.find(t => t.id === parseInt(data.templateId || "0"));

    if (template) {
      const missingParams = Object.entries(template.parameters)
        .filter(([key, param]) => param.required && !data.parameters[key])
        .map(([key]) => key);

      if (missingParams.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Missing required parameters: ${missingParams.join(", ")}`,
        });
        return;
      }
    }

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
                value={field.value || "custom"}
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
                {selectedTemplate
                  ? "Customize the template formula if needed"
                  : "How this metric should be calculated"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTemplate && Object.entries(selectedTemplate.parameters).map(([key, param]) => (
          <FormField
            key={key}
            control={form.control}
            name={`parameters.${key}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{key}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={param.description}
                    type={param.type === "number" ? "number" : "text"}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{param.description}</FormDescription>
                {param.required && <FormMessage>This field is required</FormMessage>}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {initialData && (
          <FormField
            control={form.control}
            name="changeMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Change Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what changed in this update"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a brief description of the changes made
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={createMetricMutation.isPending}>
          {createMetricMutation.isPending
            ? initialData
              ? "Updating..."
              : "Creating..."
            : initialData
            ? "Update Metric"
            : "Create Metric"}
        </Button>
      </form>
    </Form>
  );
}