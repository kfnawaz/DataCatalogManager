import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MetricDefinitionForm from "../components/quality/MetricDefinitionForm";
import MetricDefinitionList from "../components/quality/MetricDefinitionList";

export default function MetricDefinitionsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Metric Definitions</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Metric Definition</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricDefinitionForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metric Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricDefinitionList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
