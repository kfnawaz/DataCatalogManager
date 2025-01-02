import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import ReactFlowLineage from "./ReactFlowLineage";
import D3LineageGraph from "./D3LineageGraph";

interface LineageGraphProps {
  dataProductId: number | null;
}

interface Node {
  id: string;
  type: 'source' | 'transformation' | 'target';
  label: string;
  metadata?: Record<string, any>;
}

interface Link {
  source: string;
  target: string;
  transformationLogic?: string;
}

interface LineageData {
  nodes: Node[];
  links: Link[];
  version: number;
  versions: { version: number; timestamp: string }[];
}

export default function LineageGraph({ dataProductId }: LineageGraphProps) {
  const [useReactFlow, setUseReactFlow] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Data Lineage</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Visualization:</span>
          <Select
            value={useReactFlow ? "reactflow" : "d3"}
            onValueChange={(value) => setUseReactFlow(value === "reactflow")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reactflow">React Flow</SelectItem>
              <SelectItem value="d3">D3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {useReactFlow ? (
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