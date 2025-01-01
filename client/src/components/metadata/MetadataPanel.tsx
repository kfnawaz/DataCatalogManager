import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SchemaColumn {
  name: string;
  type: string;
  description?: string;
}

interface Metadata {
  name: string;
  description?: string;
  owner: string;
  sla?: string;
  updateFrequency?: string;
  schema: {
    columns: SchemaColumn[];
  };
  tags: string[];
}

interface MetadataPanelProps {
  dataProductId: number | null;
}

export default function MetadataPanel({ dataProductId }: MetadataPanelProps) {
  const { data: metadata, isLoading, error } = useQuery<Metadata>({
    queryKey: ["/api/metadata", dataProductId],
    queryFn: async () => {
      if (!dataProductId) throw new Error("No data product selected");
      const response = await fetch(`/api/metadata/${dataProductId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch metadata: ${errorText}`);
      }
      return response.json();
    },
    enabled: dataProductId !== null,
  });

  if (!dataProductId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select a data product to view its metadata
      </div>
    );
  }

  if (isLoading) {
    return <MetadataSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load metadata"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metadata) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load metadata
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Basic Information</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">Name</TableCell>
                <TableCell className="text-foreground">{metadata.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Description</TableCell>
                <TableCell className="text-foreground">{metadata.description || 'No description available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Owner</TableCell>
                <TableCell className="text-foreground">{metadata.owner}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">SLA</TableCell>
                <TableCell className="text-foreground">{metadata.sla || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Update Frequency</TableCell>
                <TableCell className="text-foreground">{metadata.updateFrequency || 'Not specified'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Schema</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Column</TableHead>
                <TableHead className="text-foreground">Type</TableHead>
                <TableHead className="text-foreground">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metadata.schema?.columns?.map((column) => (
                <TableRow key={column.name}>
                  <TableCell className="text-foreground">{column.name}</TableCell>
                  <TableCell className="text-foreground">{column.type}</TableCell>
                  <TableCell className="text-foreground">{column.description || 'No description'}</TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No schema information available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Tags</h3>
          <div className="flex gap-2 flex-wrap">
            {metadata.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            )) || (
              <span className="text-sm text-muted-foreground">No tags available</span>
            )}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}

function MetadataSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}