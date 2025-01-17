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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ZoomIn, ZoomOut, Maximize2, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [showMinimap, setShowMinimap] = useState(true);
  const { fitView, zoomIn: flowZoomIn, zoomOut: flowZoomOut } = useReactFlow();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('input[placeholder="Search nodes..."]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
          case '+':
          case '=':
            e.preventDefault();
            flowZoomIn();
            toast({
              description: "Zoomed in (Ctrl/Cmd + +)",
              duration: 1500,
            });
            break;
          case '-':
            e.preventDefault();
            flowZoomOut();
            toast({
              description: "Zoomed out (Ctrl/Cmd + -)",
              duration: 1500,
            });
            break;
          case '0':
            e.preventDefault();
            fitView();
            toast({
              description: "Fit to view (Ctrl/Cmd + 0)",
              duration: 1500,
            });
            break;
          case 'm':
            e.preventDefault();
            setShowMinimap(prev => !prev);
            toast({
              description: `${showMinimap ? 'Hidden' : 'Shown'} minimap (Ctrl/Cmd + M)`,
              duration: 1500,
            });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flowZoomIn, flowZoomOut, fitView, showMinimap, toast]);

  useEffect(() => {
    if (!lineageData) return;

    const nodesByType = {
      source: lineageData.nodes.filter(n => n.type === 'source'),
      transformation: lineageData.nodes.filter(n => n.type === 'transformation'),
      target: lineageData.nodes.filter(n => n.type === 'target')
    };

    const flowNodes = [];
    let column = 0;

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
                placeholder="Search nodes... (Ctrl/Cmd + F)"
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
              <span className="ml-1 text-xs opacity-70">(Ctrl/Cmd + +)</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
              <span className="ml-1 text-xs opacity-70">(Ctrl/Cmd + -)</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleFitView}>
              <Maximize2 className="h-4 w-4 mr-1" />
              Fit View
              <span className="ml-1 text-xs opacity-70">(Ctrl/Cmd + 0)</span>
            </Button>
            <Button 
              size="sm" 
              variant={showMinimap ? "secondary" : "outline"}
              onClick={() => setShowMinimap(prev => !prev)}
            >
              <Map className="h-4 w-4 mr-1" />
              Minimap
              <span className="ml-1 text-xs opacity-70">(Ctrl/Cmd + M)</span>
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
            {showMinimap && (
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
                className="!bottom-20 !right-2"
              />
            )}
            <Panel position="bottom-center" className="p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
              <div className="text-xs text-muted-foreground space-x-4">
                <span>Ctrl/Cmd + F: Search</span>
                <span>Ctrl/Cmd + +/-: Zoom</span>
                <span>Ctrl/Cmd + 0: Fit View</span>
                <span>Ctrl/Cmd + M: Toggle Minimap</span>
              </div>
            </Panel>
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