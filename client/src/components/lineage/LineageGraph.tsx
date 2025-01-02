import { useState, useEffect } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import ReactFlowLineage from "./ReactFlowLineage";
import D3LineageGraph from "./D3LineageGraph";

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
  const [visualizationType, setVisualizationType] = useState<string>("reactflow");
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

        {/* Visualization Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium">View:</span>
          <ToggleGroup
            type="single"
            value={visualizationType}
            onValueChange={(value) => {
              if (value) setVisualizationType(value);
            }}
            aria-label="Visualization type"
          >
            <ToggleGroupItem value="reactflow" aria-label="Advanced visualization">
              Advanced
            </ToggleGroupItem>
            <ToggleGroupItem value="d3" aria-label="Simple visualization">
              Simple
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {visualizationType === "reactflow" ? (
        <ReactFlowLineage 
          dataProductId={dataProductId} 
          lineageData={lineageData} 
          isLoading={isLoading}
        />
      ) : (
        <D3LineageGraph 
          dataProductId={dataProductId} 
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
        />
      )}
    </div>
  );
}

function getNodeColor(type: string): string {
  switch (type) {
    case "source":
      return "#4CAF50";
    case "transformation":
      return "#2196F3";
    case "target":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
}