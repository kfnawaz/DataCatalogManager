import { useState } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Info } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import ReactFlowLineage from "./ReactFlowLineage";
import D3LineageGraph from "./D3LineageGraph";

interface LineageGraphProps {
  dataProductId: number | null;
}

export default function LineageGraph({ dataProductId }: LineageGraphProps) {
  const [visualizationType, setVisualizationType] = useState<string>("reactflow");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Data Lineage</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Visualization:</span>
          <ToggleGroup
            type="single"
            value={visualizationType}
            onValueChange={(value) => {
              if (value) setVisualizationType(value);
            }}
            aria-label="Visualization type"
          >
            <ToggleGroupItem value="reactflow" aria-label="React Flow">
              React Flow
            </ToggleGroupItem>
            <ToggleGroupItem value="d3" aria-label="D3">
              D3
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {visualizationType === "reactflow" ? (
        <ReactFlowLineage dataProductId={dataProductId} />
      ) : (
        <D3LineageGraph dataProductId={dataProductId} />
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