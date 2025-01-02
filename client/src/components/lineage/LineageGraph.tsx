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
import { Info } from "lucide-react";

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
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);

  const { data: lineageData, isLoading } = useQuery<LineageData>({
    queryKey: ["/api/lineage", dataProductId, selectedVersion],
    enabled: dataProductId !== null,
  });

  useEffect(() => {
    if (!lineageData || !svgRef.current) return;

    // Set default version if not selected
    if (!selectedVersion && lineageData.version) {
      setSelectedVersion(lineageData.version);
    }

    const width = 800;
    const height = 600;
    const nodeRadius = 25;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const g = svg.append("g");

    // Define arrow marker
    svg.append("defs")
      .selectAll("marker")
      .data(["end-arrow"])
      .enter()
      .append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeRadius + 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    const simulation = d3
      .forceSimulation(lineageData.nodes as any)
      .force(
        "link",
        d3
          .forceLink(lineageData.links)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius * 1.5));

    const links = g
      .append("g")
      .selectAll("path")
      .data(lineageData.links)
      .enter()
      .append("path")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#end-arrow)")
      .on("mouseover", function(event, d) {
        if (d.transformationLogic) {
          setTooltipContent(d.transformationLogic);
        }
      })
      .on("mouseout", () => {
        setTooltipContent(null);
      });

    const nodes = g
      .append("g")
      .selectAll("g")
      .data(lineageData.nodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );

    // Add circles for nodes
    nodes
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: Node) => getNodeColor(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add text labels
    nodes
      .append("text")
      .text((d: Node) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", nodeRadius + 20)
      .attr("fill", "currentColor")
      .attr("font-size", "12px");

    simulation.on("tick", () => {
      links.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [lineageData]);

  if (!dataProductId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select a data product to view its lineage
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
                {lineageData?.versions.map((v) => (
                  <SelectItem key={v.version} value={v.version.toString()}>
                    Version {v.version} ({new Date(v.timestamp).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4CAF50]" />
              <span className="text-sm">Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2196F3]" />
              <span className="text-sm">Transformation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F44336]" />
              <span className="text-sm">Target</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <svg ref={svgRef} className="w-full border rounded-lg" />
          {tooltipContent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs whitespace-pre-wrap">{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
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