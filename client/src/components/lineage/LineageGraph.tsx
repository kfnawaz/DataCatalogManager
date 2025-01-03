import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactFlowLineage from "./ReactFlowLineage";

interface LineageGraphProps {
  dataProductId: number | null;
}

interface LineageData {
  nodes: Array<{
    id: string;
    type: 'source' | 'transformation' | 'target';
    label: string;
    metadata?: Record<string, any>;
  }>;
  links: Array<{
    source: string;
    target: string;
    transformationLogic?: string;
  }>;
  version: number;
  versions: { version: number; timestamp: string }[];
}

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
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Data Lineage</h2>

          {/* Legend */}
          <div className="flex items-center gap-4 border-l pl-4">
            <div className="flex items-center gap-2" role="presentation">
              <div className="w-3 h-3 rounded-full bg-[#4CAF50]" aria-hidden="true" />
              <span className="text-sm">Source</span>
            </div>
            <div className="flex items-center gap-2" role="presentation">
              <div className="w-3 h-3 rounded-full bg-[#2196F3]" aria-hidden="true" />
              <span className="text-sm">Transformation</span>
            </div>
            <div className="flex items-center gap-2" role="presentation">
              <div className="w-3 h-3 rounded-full bg-[#F44336]" aria-hidden="true" />
              <span className="text-sm">Target</span>
            </div>
          </div>
        </div>

        {/* Version Selection */}
        {lineageData?.versions && lineageData.versions.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
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
                    key={`version-${v.version}-${v.timestamp}`}
                    value={v.version.toString()}
                  >
                    Version {v.version} ({new Date(v.timestamp).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ReactFlowLineage 
        dataProductId={dataProductId} 
        lineageData={lineageData || null}
        isLoading={isLoading}
      />
    </div>
  );
}