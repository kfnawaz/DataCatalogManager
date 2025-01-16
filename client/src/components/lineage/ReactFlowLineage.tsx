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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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
      case 'source':
        return {
          ...baseStyle,
          background: '#4CAF50',
          color: 'white',
          borderColor: '#43A047',
        };
      case 'transformation':
        return {
          ...baseStyle,
          background: '#2196F3',
          color: 'white',
          borderColor: '#1E88E5',
        };
      case 'target':
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
          {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
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

const LAYOUT_CONFIG = {
  HORIZONTAL_SPACING: 250,
  VERTICAL_SPACING: 100,
  INITIAL_X: 50,
  INITIAL_Y: 50,
};

function LineageFlow({ dataProductId, lineageData, isLoading }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { fitView, zoomIn: flowZoomIn, zoomOut: flowZoomOut } = useReactFlow();

  useEffect(() => {
    if (!lineageData) return;

    // Group nodes by type
    const nodesByType = {
      source: lineageData.nodes.filter(n => n.type === 'source'),
      transformation: lineageData.nodes.filter(n => n.type === 'transformation'),
      target: lineageData.nodes.filter(n => n.type === 'target')
    };

    // Create nodes with hierarchical positioning
    const flowNodes = [];
    let column = 0;

    // Position source nodes on the left
    nodesByType.source.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: {
          x: LAYOUT_CONFIG.INITIAL_X + (column * LAYOUT_CONFIG.HORIZONTAL_SPACING),
          y: LAYOUT_CONFIG.INITIAL_Y + (index * LAYOUT_CONFIG.VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          isHighlighted: !searchTerm || node.label.toLowerCase().includes(searchTerm.toLowerCase()),
        },
      });
    });

    // Position transformation nodes in the middle
    column++;
    nodesByType.transformation.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: {
          x: LAYOUT_CONFIG.INITIAL_X + (column * LAYOUT_CONFIG.HORIZONTAL_SPACING),
          y: LAYOUT_CONFIG.INITIAL_Y + (index * LAYOUT_CONFIG.VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          isHighlighted: !searchTerm || node.label.toLowerCase().includes(searchTerm.toLowerCase()),
        },
      });
    });

    // Position target nodes on the right
    column++;
    nodesByType.target.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: {
          x: LAYOUT_CONFIG.INITIAL_X + (column * LAYOUT_CONFIG.HORIZONTAL_SPACING),
          y: LAYOUT_CONFIG.INITIAL_Y + (index * LAYOUT_CONFIG.VERTICAL_SPACING)
        },
        data: {
          label: node.label,
          type: node.type,
          isHighlighted: !searchTerm || node.label.toLowerCase().includes(searchTerm.toLowerCase()),
        },
      });
    });

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

  const handleZoomIn = useCallback(() => {
    flowZoomIn();
  }, [flowZoomIn]);

  const handleZoomOut = useCallback(() => {
    flowZoomOut();
  }, [flowZoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 800, padding: 0.2 });
  }, [fitView]);

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
            <MiniMap 
              nodeColor={(node) => {
                switch (node.data?.type) {
                  case 'source':
                    return '#4CAF50';
                  case 'transformation':
                    return '#2196F3';
                  case 'target':
                    return '#F44336';
                  default:
                    return '#999';
                }
              }}
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