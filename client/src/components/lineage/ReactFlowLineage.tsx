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
import { Search, ZoomIn, ZoomOut, Maximize2, Download, Share2, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as htmlToImage from 'html-to-image';

interface LineageMetadata {
  owner?: string;
  sla?: string;
  qualityMetrics?: {
    accuracy?: number;
    completeness?: number;
    timeliness?: number;
  };
  version?: string;
  description?: string;
  format?: string;
  frequency?: string;
  dataVolume?: string;
  latency?: string;
  schema?: {
    name: string;
    type: string;
    description?: string;
  }[];
}

interface TransformationMetadata {
  type: string;
  frequency: string;
  dependencies: string[];
  validationRules?: string[];
  impact?: string;
}

interface LineageNode {
  id: string;
  type: 'source-aligned' | 'aggregate' | 'consumer-aligned';
  label: string;
  category?: string;
  metadata?: LineageMetadata;
}

interface LineageLink {
  source: string;
  target: string;
  transformationLogic?: string;
  metadata?: TransformationMetadata;
}

interface ReactFlowLineageProps {
  dataProductId: number | null;
  lineageData: {
    nodes: LineageNode[];
    links: LineageLink[];
  } | null;
  isLoading: boolean;
}

// Format metadata for display with enhanced details
const formatMetadataForDisplay = (metadata: LineageMetadata | TransformationMetadata): JSX.Element => {
  const formatQualityMetrics = (metrics: LineageMetadata['qualityMetrics']) => {
    if (!metrics) return null;
    return (
      <div className="mt-2">
        <div className="font-medium mb-1">Quality Metrics:</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="text-center">
              <Badge variant={value >= 0.8 ? "success" : value >= 0.6 ? "warning" : "destructive"}>
                {(value * 100).toFixed(1)}%
              </Badge>
              <div className="text-xs mt-1 capitalize">{key}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 p-3">
      {Object.entries(metadata).map(([key, value]) => {
        if (key === 'qualityMetrics') {
          return formatQualityMetrics(value as LineageMetadata['qualityMetrics']);
        }
        if (key === 'schema' && Array.isArray(value)) {
          return (
            <div key={key} className="space-y-2">
              <div className="font-medium">Schema:</div>
              <div className="space-y-1">
                {value.map((field, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{field.name}</span>
                    <span className="text-muted-foreground"> ({field.type})</span>
                    {field.description && (
                      <div className="text-xs text-muted-foreground">{field.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (typeof value === 'object') {
          return (
            <div key={key} className="space-y-1">
              <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</div>
              <div className="text-sm text-muted-foreground">
                {Array.isArray(value) ? value.join(', ') : JSON.stringify(value, null, 2)}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="text-sm">
            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
            <span className="text-muted-foreground">{value}</span>
          </div>
        );
      })}
    </div>
  );
};

// Custom node component with enhanced styling and metadata display
function LineageNodeComponent({ data }: { data: { label: string; type: string; metadata?: LineageMetadata; isHighlighted?: boolean } }) {
  const getNodeStyle = (type: string, isHighlighted?: boolean) => {
    const baseStyle = {
      padding: '16px',
      border: '2px solid',
      borderRadius: '8px',
      minWidth: '200px',
      transition: 'all 0.2s ease',
      opacity: isHighlighted === false ? 0.5 : 1,
    };

    switch (type) {
      case 'source-aligned':
        return {
          ...baseStyle,
          background: '#4CAF50',
          color: 'white',
          borderColor: '#43A047',
          boxShadow: isHighlighted ? '0 0 15px rgba(76, 175, 80, 0.5)' : '0 0 0 1px rgba(76, 175, 80, 0.2)',
        };
      case 'aggregate':
        return {
          ...baseStyle,
          background: '#2196F3',
          color: 'white',
          borderColor: '#1E88E5',
          boxShadow: isHighlighted ? '0 0 15px rgba(33, 150, 243, 0.5)' : '0 0 0 1px rgba(33, 150, 243, 0.2)',
        };
      case 'consumer-aligned':
        return {
          ...baseStyle,
          background: '#F44336',
          color: 'white',
          borderColor: '#E53935',
          boxShadow: isHighlighted ? '0 0 15px rgba(244, 67, 54, 0.5)' : '0 0 0 1px rgba(244, 67, 54, 0.2)',
        };
      default:
        return baseStyle;
    }
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
              className="!bg-white !border-2 !border-current"
              aria-label="Input connection point"
            />
            <div className="text-center">
              <div className="font-medium mb-1">{data.label}</div>
              <div className="text-xs text-white/80">
                {data.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </div>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              className="!bg-white !border-2 !border-current"
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['source-aligned', 'aggregate', 'consumer-aligned']);
  const { fitView, zoomIn: flowZoomIn, zoomOut: flowZoomOut, getNodes } = useReactFlow();
  const { toast } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);

  // Layout configuration
  const LAYOUT_CONFIG = {
    HORIZONTAL_SPACING: 300,
    VERTICAL_SPACING: 150,
    INITIAL_X: 50,
    INITIAL_Y: 50,
    LEVEL_HEIGHT: 200,
  };

  useEffect(() => {
    if (!lineageData) return;

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

    // Group nodes by type for hierarchical layout
    const sourceNodes = uniqueNodes.filter(n => n.type === 'source-aligned');
    const aggregateNodes = uniqueNodes.filter(n => n.type === 'aggregate');
    const consumerNodes = uniqueNodes.filter(n => n.type === 'consumer-aligned');

    // Calculate positions for hierarchical layout
    const flowNodes = [
      ...sourceNodes.map((node, i) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: LAYOUT_CONFIG.INITIAL_X,
          y: LAYOUT_CONFIG.INITIAL_Y + (i * LAYOUT_CONFIG.VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          isHighlighted: isNodeVisible(node),
        },
        ariaLabel: `Source-aligned node: ${node.label}`,
      })),
      ...aggregateNodes.map((node, i) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: LAYOUT_CONFIG.INITIAL_X + LAYOUT_CONFIG.HORIZONTAL_SPACING,
          y: LAYOUT_CONFIG.INITIAL_Y + (i * LAYOUT_CONFIG.VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          isHighlighted: isNodeVisible(node),
        },
        ariaLabel: `Aggregate node: ${node.label}`,
      })),
      ...consumerNodes.map((node, i) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: LAYOUT_CONFIG.INITIAL_X + (LAYOUT_CONFIG.HORIZONTAL_SPACING * 2),
          y: LAYOUT_CONFIG.INITIAL_Y + (i * LAYOUT_CONFIG.VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          isHighlighted: isNodeVisible(node),
        },
        ariaLabel: `Consumer-aligned node: ${node.label}`,
      })),
    ];

    // Create edges between visible nodes with enhanced styling
    const visibleNodeIds = flowNodes
      .filter(node => node.data.isHighlighted)
      .map(node => node.id);

    const uniqueEdgesMap = new Map();
    lineageData.links.forEach(link => {
      if (visibleNodeIds.includes(link.source) && visibleNodeIds.includes(link.target)) {
        const edgeKey = `${link.source}-${link.target}-${Date.now()}`;
        uniqueEdgesMap.set(edgeKey, {
          id: edgeKey,
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
          data: {
            metadata: link.metadata,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: 'hsl(var(--foreground))',
          },
        });
      }
    });

    setNodes(flowNodes);
    setEdges(Array.from(uniqueEdgesMap.values()));
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
            {['source-aligned', 'aggregate', 'consumer-aligned'].map(type => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleTypeToggle(type)}
              >
                {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                  case "source-aligned":
                    return "hsl(142.1 70.6% 45.3%)";
                  case "aggregate":
                    return "hsl(217.2 91.2% 59.8%)";
                  case "consumer-aligned":
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