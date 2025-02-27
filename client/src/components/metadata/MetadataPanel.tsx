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
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DataProductComments from "../comments/DataProductComments"; //Import added here

interface SchemaProperty {
  type: string;
  description?: string;
  format?: string;
  enum?: string[];
}

interface Schema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

interface Metadata {
  name: string;
  description?: string;
  owner: string;
  sources?: string[];
  domain: string;
  sla?: string;
  updateFrequency?: string;
  schema: Schema;
  tags: string[];
}

interface MetadataPanelProps {
  dataProductId: number | null;
}

export default function MetadataPanel({ dataProductId }: MetadataPanelProps) {
  const { data: metadata, isLoading } = useQuery<Metadata>({
    queryKey: [`/api/metadata/${dataProductId}`],
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

  if (!metadata) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load metadata
      </div>
    );
  }

  // Helper function to format schema property type
  const formatPropertyType = (property: SchemaProperty): string => {
    let type = property.type;
    if (property.format === "date-time") {
      type = "datetime";
    }
    if (property.enum) {
      type = `enum(${property.enum.join(", ")})`;
    }
    return type;
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            Basic Information
          </h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  Name
                </TableCell>
                <TableCell className="text-foreground">
                  {metadata.name}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  Description
                </TableCell>
                <TableCell className="text-foreground">
                  {metadata.description || "No description available"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  Owner
                </TableCell>
                <TableCell className="text-foreground">
                  {metadata.owner}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  Domain
                </TableCell>
                <TableCell className="text-foreground">
                  {metadata.domain}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  Sources
                </TableCell>
                <TableCell className="text-foreground">
                  {Array.isArray(metadata.sources) &&
                  metadata.sources.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {metadata.sources.map((source, index) => (
                        <Badge key={`${source}-${index}`} variant="secondary">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "No sources specified"
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  SLA
                </TableCell>
                <TableCell className="text-foreground">
                  {metadata.sla || "Not specified"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">
                  Update Frequency
                </TableCell>
                <TableCell className="text-foreground">
                  {metadata.updateFrequency || "Not specified"}
                </TableCell>
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
                <TableHead className="text-foreground">Required</TableHead>
                <TableHead className="text-foreground">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metadata.schema?.properties ? (
                Object.entries(metadata.schema.properties).map(
                  ([name, property]) => (
                    <TableRow key={name}>
                      <TableCell className="font-medium text-foreground">
                        {name}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          {formatPropertyType(property)}
                          {property.enum && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Allowed values: {property.enum.join(", ")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {metadata.schema.required?.includes(name) ? (
                          <Badge variant="default">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {property.description || "No description"}
                      </TableCell>
                    </TableRow>
                  ),
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
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
              <Badge key={tag} variant="secondary" className="text-foreground">
                {tag}
              </Badge>
            )) || (
              <span className="text-sm text-muted-foreground">
                No tags available
              </span>
            )}
          </div>
        </section>
        <div className="mt-6">
          {" "}
          {/* Added div for spacing */}
          <DataProductComments dataProductId={dataProductId} />
        </div>
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
