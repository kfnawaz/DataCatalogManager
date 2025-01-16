import { useEffect, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Search, ZoomIn, ZoomOut, Maximize2, Download, Share2, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as htmlToImage from 'html-to-image';
import { Database, Git, Table, FileSpreadsheet, Code, ChartBar } from "lucide-react";

interface LineageMetadata {
  description?: string;
  format?: string;
  frequency?: string;
  algorithm?: string;
  parameters?: Record<string, any>;
  dataVolume?: string;
  latency?: string;
  schedule?: string;
  distribution?: string;
  quality?: number;
}

interface LineageNode {
  id: string;
  type: 'source' | 'transformation' | 'target';
  label: string;
  metadata?: LineageMetadata;
}

interface LineageLink {
  source: string;
  target: string;
  transformationLogic?: string;
  metadata?: LineageMetadata;
}

interface ReactFlowLineageProps {
  dataProductId: number | null;
  lineageData: {
    nodes: LineageNode[];
    links: LineageLink[];
  } | null;
  isLoading: boolean;
}

// Format metadata for display
const formatMetadataForDisplay = (metadata: LineageMetadata): JSX.Element => {
  return (
    <div className="space-y-2 p-2">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="text-sm">
          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
          <span className="text-muted-foreground">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Enhanced node styling component
function LineageNodeComponent({ data }: { data: { label: string; type: string; metadata?: LineageMetadata; isHighlighted?: boolean } }) {
  const getNodeStyle = (type: string, isHighlighted?: boolean) => {
    const baseStyle = {
      padding: '16px',
      transition: 'all 0.3s ease',
      opacity: isHighlighted === false ? 0.5 : 1,
      minWidth: '200px',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
    };

    switch (type) {
      case 'source':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
          color: 'white',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          border: '2px solid #43A047',
          boxShadow: isHighlighted
            ? '0 0 20px rgba(76, 175, 80, 0.5)'
            : '0 4px 6px rgba(76, 175, 80, 0.2)',
        };
      case 'transformation':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #2196F3 0%, #1e88e5 100%)',
          color: 'white',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          border: '2px solid #1E88E5',
          boxShadow: isHighlighted
            ? '0 0 20px rgba(33, 150, 243, 0.5)'
            : '0 4px 6px rgba(33, 150, 243, 0.2)',
          animation: isHighlighted ? 'pulse 2s infinite' : 'none',
        };
      case 'target':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #F44336 0%, #e53935 100%)',
          color: 'white',
          borderRadius: '12px',
          border: '2px solid #E53935',
          boxShadow: isHighlighted
            ? '0 0 20px rgba(244, 67, 54, 0.5)'
            : '0 4px 6px rgba(244, 67, 54, 0.2)',
        };
      default:
        return baseStyle;
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'source':
        return <Database className="h-6 w-6 mb-2" />;
      case 'transformation':
        return <Code className="h-6 w-6 mb-2" />;
      case 'target':
        return <ChartBar className="h-6 w-6 mb-2" />;
      default:
        return null;
    }
  };

  const getQualityIndicator = (metadata?: LineageMetadata) => {
    if (!metadata) return null;
    const quality = metadata.quality || 0.75; // Default quality score
    const color = quality > 0.8 ? '#4CAF50' : quality > 0.6 ? '#FFC107' : '#F44336';

    return (
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  };

  const getMetadataBadges = (metadata?: LineageMetadata) => {
    if (!metadata) return null;

    return (
      <div className="flex gap-1 mt-2">
        {metadata.format && (
          <Badge variant="secondary" className="text-xs">
            {metadata.format}
          </Badge>
        )}
        {metadata.frequency && (
          <Badge variant="secondary" className="text-xs">
            {metadata.frequency}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            style={getNodeStyle(data.type, data.isHighlighted)}
            className="group relative focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            role="button"
            tabIndex={0}
            aria-label={`${data.type} node: ${data.label}`}
          >
            <Handle
              type="target"
              position={Position.Left}
              className="!bg-white !border-2 !border-current !w-3 !h-3"
              aria-label="Input connection point"
            />
            {getQualityIndicator(data.metadata)}
            {getNodeIcon(data.type)}
            <div className="text-center z-10">
              <div className="font-medium mb-1">{data.label}</div>
              <div className="text-xs opacity-80">
                {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
              </div>
              {getMetadataBadges(data.metadata)}
            </div>
            <Handle
              type="source"
              position={Position.Right}
              className="!bg-white !border-2 !border-current !w-3 !h-3"
              aria-label="Output connection point"
            />
          </div>
        </TooltipTrigger>
        {data.metadata && (
          <TooltipContent side="top" align="center" className="max-w-sm">
            {formatMetadataForDisplay(data.metadata)}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// Add keyframe animation for transformation nodes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);

const nodeTypes = {
  custom: LineageNodeComponent,
};

// Generate a unique edge ID
const generateEdgeId = (source: string, target: string): string => {
  return `edge-${source}-${target}-${Date.now()}`;
};

function LineageFlow({ dataProductId, lineageData, isLoading }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['source', 'transformation', 'target']);
  const { fitView, zoomIn: flowZoomIn, zoomOut: flowZoomOut, getNodes } = useReactFlow();
  const { toast } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);

  // Zoom level presets
  const zoomToFit = useCallback(() => {
    fitView({ duration: 800, padding: 0.2 });
  }, [fitView]);

  const handleZoomIn = () => flowZoomIn({ duration: 800 });
  const handleZoomOut = () => flowZoomOut({ duration: 800 });

  useEffect(() => {
    if (!lineageData) return;

    // Calculate layout positions
    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 120;
    const INITIAL_X = 50;
    const INITIAL_Y = 50;

    // Filter and highlight nodes based on search and type filters
    const isNodeVisible = (node: LineageNode) => {
      const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedTypes.includes(node.type);
      return matchesSearch && matchesType;
    };

    // Create a Map to deduplicate nodes
    const uniqueNodesMap = new Map();
    lineageData.nodes.forEach(node => {
      uniqueNodesMap.set(node.id, node);
    });
    const uniqueNodes = Array.from(uniqueNodesMap.values());

    // Group nodes by type
    const sourceNodes = uniqueNodes.filter(n => n.type === 'source');
    const transformNodes = uniqueNodes.filter(n => n.type === 'transformation');
    const targetNodes = uniqueNodes.filter(n => n.type === 'target');

    // Create nodes with positions and highlighting
    const flowNodes = [
      ...sourceNodes.map((node, i) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: INITIAL_X,
          y: INITIAL_Y + (i * VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          isHighlighted: isNodeVisible(node),
        },
        ariaLabel: `Source node: ${node.label}`,
      })),
      ...transformNodes.map((node, i) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: INITIAL_X + HORIZONTAL_SPACING,
          y: INITIAL_Y + (i * VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          isHighlighted: isNodeVisible(node),
        },
        ariaLabel: `Transformation node: ${node.label}`,
      })),
      ...targetNodes.map((node, i) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: INITIAL_X + (HORIZONTAL_SPACING * 2),
          y: INITIAL_Y + (i * VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          isHighlighted: isNodeVisible(node),
        },
        ariaLabel: `Target node: ${node.label}`,
      })),
    ];

    // Create edges between visible nodes
    const visibleNodeIds = flowNodes
      .filter(node => node.data.isHighlighted)
      .map(node => node.id);

    // Create a Map to deduplicate edges
    const uniqueEdgesMap = new Map();
    lineageData.links.forEach(link => {
      if (visibleNodeIds.includes(link.source) && visibleNodeIds.includes(link.target)) {
        const edgeKey = `${link.source}-${link.target}`;
        uniqueEdgesMap.set(edgeKey, link);
      }
    });

    // Create edges from unique links with tooltips
    const flowEdges = Array.from(uniqueEdgesMap.values()).map(link => ({
      id: generateEdgeId(link.source, link.target),
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      label: link.transformationLogic,
      labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 500 },
      style: {
        stroke: 'hsl(var(--foreground))',
        strokeWidth: 2,
      },
      ariaLabel: `Connection from ${link.source} to ${link.target}${link.transformationLogic ? `: ${link.transformationLogic}` : ''}`,
      data: {
        metadata: link.metadata,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: 'hsl(var(--foreground))',
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [lineageData, searchTerm, selectedTypes, setNodes, setEdges]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Export functionality
  const downloadImage = useCallback(async (type: 'svg' | 'png') => {
    if (!flowRef.current) return;

    try {
      let dataUrl;
      if (type === 'svg') {
        dataUrl = await htmlToImage.toSvg(flowRef.current, {
          quality: 1,
          backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        });
      } else {
        dataUrl = await htmlToImage.toPng(flowRef.current, {
          quality: 1,
          backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        });
      }

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `lineage-graph-${Date.now()}.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Graph exported as ${type.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export the graph. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Share functionality
  const shareGraph = useCallback(async () => {
    try {
      // Create a shareable URL with current graph state
      const state = {
        dataProductId,
        searchTerm,
        selectedTypes,
        nodes: getNodes(),
      };

      const stateParam = encodeURIComponent(JSON.stringify(state));
      const url = `${window.location.origin}${window.location.pathname}?state=${stateParam}`;

      await navigator.clipboard.writeText(url);

      toast({
        title: "Link Copied",
        description: "Shareable link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to create shareable link. Please try again.",
        variant: "destructive",
      });
    }
  }, [dataProductId, searchTerm, selectedTypes, getNodes, toast]);

  return (
    <Card className="w-full space-y-4">
      {/* Filter controls */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['source', 'transformation', 'target'].map(type => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleTypeToggle(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            <Button size="sm" variant="outline" onClick={zoomToFit}>
              <Maximize2 className="h-4 w-4 mr-1" />
              Fit View
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadImage('svg')}>
              <Image className="h-4 w-4 mr-1" />
              Export SVG
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadImage('png')}>
              <Download className="h-4 w-4 mr-1" />
              Export PNG
            </Button>
            <Button size="sm" variant="outline" onClick={shareGraph}>
              <Share2 className="h-4 w-4 mr-1" />
              Share Graph
            </Button>
          </div>
        </div>
      </div>

      {/* Graph area */}
      <div className="h-[600px]" ref={flowRef}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full p-8" role="alert" aria-live="polite">
              <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse">
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  Loading lineage data...
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-background"
            aria-label="Data lineage visualization"
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: 'hsl(var(--muted-foreground))',
              },
            }}
          >
            <Background
              color="hsl(var(--muted-foreground))"
              className="opacity-5"
            />
            <Controls
              className="bg-card border border-border shadow-sm"
              position="bottom-right"
              showInteractive={false}
              aria-label="Graph controls"
            />
            <MiniMap
              nodeStrokeColor="hsl(var(--muted-foreground))"
              nodeColor={node => {
                switch (node.data?.type) {
                  case "source":
                    return "hsl(142.1 70.6% 45.3%)";
                  case "transformation":
                    return "hsl(217.2 91.2% 59.8%)";
                  case "target":
                    return "hsl(0 84.2% 60.2%)";
                  default:
                    return "hsl(var(--muted))";
                }
              }}
              maskColor="hsl(var(--background) / 0.7)"
              style={{
                backgroundColor: "hsl(var(--card) / 0.8)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 2px 4px hsl(var(--background) / 0.1)",
              }}
              className="!bottom-24 transition-colors duration-200"
              position="bottom-right"
              aria-label="Minimap overview"
            />
          </ReactFlow>
        )}
      </div>
    </Card>
  );
}

export default function ReactFlowLineage(props: ReactFlowLineageProps) {
  return (
    <ReactFlowProvider>
      <LineageFlow {...props} />
    </ReactFlowProvider>
  );
}