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
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";


interface LineageNode {
  id: string;
  type: 'source-aligned' | 'aggregate' | 'consumer-aligned';
  label: string;
  metadata?: Record<string, any>;
}

interface LineageLink {
  source: string;
  target: string;
  transformationLogic?: string;
}

interface ReactFlowLineageProps {
  dataProductId: number | null;
  lineageData: {
    nodes: LineageNode[];
    links: LineageLink[];
  } | null;
  isLoading: boolean;
}

// Custom node component with enhanced styling
function LineageNodeComponent({ data }: { data: { label: string; type: string; isHighlighted?: boolean } }) {
  const getNodeStyle = (type: string, isHighlighted?: boolean) => {
    const baseStyle = {
      padding: '16px',
      border: '2px solid',
      borderRadius: '8px',
      minWidth: '200px',
      opacity: isHighlighted === false ? 0.5 : 1,
    };

    switch (type) {
      case 'source-aligned':
        return {
          ...baseStyle,
          background: '#4CAF50',
          color: 'white',
          borderColor: '#43A047',
        };
      case 'aggregate':
        return {
          ...baseStyle,
          background: '#2196F3',
          color: 'white',
          borderColor: '#1E88E5',
        };
      case 'consumer-aligned':
        return {
          ...baseStyle,
          background: '#F44336',
          color: 'white',
          borderColor: '#E53935',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={getNodeStyle(data.type, data.isHighlighted)}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-background"
      />
      <div className="text-center">
        <div className="font-medium">{data.label}</div>
        <div className="text-xs opacity-80">
          {data.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-background"
      />
    </div>
  );
}

const nodeTypes = {
  custom: LineageNodeComponent,
};

function LineageFlow({ dataProductId, lineageData, isLoading }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { fitView, zoomIn: flowZoomIn, zoomOut: flowZoomOut } = useReactFlow();
  const { toast } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lineageData) return;

    // Create nodes with proper positioning
    const flowNodes = lineageData.nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: { 
        x: (index % 3) * 300 + 50,
        y: Math.floor(index / 3) * 200 + 50
      },
      data: {
        label: node.label,
        type: node.type,
        isHighlighted: !searchTerm || node.label.toLowerCase().includes(searchTerm.toLowerCase()),
      },
    }));

    // Create edges between nodes
    const flowEdges = lineageData.links.map((link) => ({
      id: `edge-${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      label: link.transformationLogic,
      style: { stroke: '#666' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [lineageData, searchTerm, setNodes, setEdges]);

  // Zoom control functions
  const handleZoomIn = useCallback(() => {
    flowZoomIn();
  }, [flowZoomIn]);

  const handleZoomOut = useCallback(() => {
    flowZoomOut();
  }, [flowZoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 800 });
  }, [fitView]);

  // Export functionality (retained from original code)
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


  return (
    <Card className="w-full space-y-4">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
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
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            <Button size="sm" variant="outline" onClick={handleFitView}>
              <Maximize2 className="h-4 w-4 mr-1" />
              Fit View
            </Button>
          </div>
        </div>
      </div>

      <div style={{ height: '600px' }}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            Loading lineage data...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Background />
            <Controls />
            <MiniMap />
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