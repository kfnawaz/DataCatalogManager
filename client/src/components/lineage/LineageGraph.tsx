import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactFlowLineage from "./ReactFlowLineage";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LineageGraphProps {
  dataProductId: number | null;
}

interface LineageNode {
  id: string;
  type: 'source' | 'transformation' | 'target';
  label: string;
  metadata?: Record<string, any>;
}

interface LineageLink {
  source: string;
  target: string;
  transformationLogic?: string;
}

interface LineageData {
  nodes: LineageNode[];
  links: LineageLink[];
  version: number;
  versions: { version: number; timestamp: string }[];
}

const generateVersionKey = (version: number, timestamp: string): string => {
  return `lineage-version-${version}-${new Date(timestamp).getTime()}`;
};

export default function LineageGraph({ dataProductId }: LineageGraphProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const { data: lineageData, isLoading } = useQuery<LineageData>({
    queryKey: [`/api/lineage?dataProductId=${dataProductId}${selectedVersion ? `&version=${selectedVersion}` : ''}`],
    enabled: dataProductId !== null,
  });

  // Set initial version when data is loaded
  useEffect(() => {
    if (lineageData?.version && !selectedVersion) {
      setSelectedVersion(lineageData.version);
    }
  }, [lineageData?.version, selectedVersion]);

  return (
    <div className="space-y-4">
      {/* Version Selection */}
      {lineageData?.versions && lineageData.versions.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Version:</span>
          <Select
            value={selectedVersion?.toString()}
            onValueChange={(value) => setSelectedVersion(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {lineageData.versions.map((v) => (
                <SelectItem
                  key={generateVersionKey(v.version, v.timestamp)}
                  value={v.version.toString()}
                >
                  Version {v.version} ({new Date(v.timestamp).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Lineage Graph</CardTitle>
        </CardHeader>
        <ReactFlowLineage 
          dataProductId={dataProductId} 
          lineageData={lineageData || null}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}