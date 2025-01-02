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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import ReactFlowLineage from "./ReactFlowLineage";
import D3LineageGraph from "./D3LineageGraph"; // Previous implementation

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

  return useReactFlow ? (
    <ReactFlowLineage dataProductId={dataProductId} />
  ) : (
    <D3LineageGraph dataProductId={dataProductId} />
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