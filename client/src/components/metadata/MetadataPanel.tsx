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
  const { data: metadata, isLoading } = useQuery<Metadata>({
    queryKey: ["/api/metadata", dataProductId],
    enabled: dataProductId !== null,
  });

  if (!dataProductId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select a data product to view its metadata
      </div>
    );
  }

  if (isLoading || !metadata) {
    return <MetadataSkeleton />;
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Name</TableCell>
                <TableCell>{metadata.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Description</TableCell>
                <TableCell>{metadata.description || 'No description available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Owner</TableCell>
                <TableCell>{metadata.owner}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SLA</TableCell>
                <TableCell>{metadata.sla || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Update Frequency</TableCell>
                <TableCell>{metadata.updateFrequency || 'Not specified'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Schema</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metadata.schema.columns.map((column) => (
                <TableRow key={column.name}>
                  <TableCell>{column.name}</TableCell>
                  <TableCell>{column.type}</TableCell>
                  <TableCell>{column.description || 'No description'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Tags</h3>
          <div className="flex gap-2 flex-wrap">
            {metadata.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))} 
            {(!metadata.tags || metadata.tags.length === 0) && (
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