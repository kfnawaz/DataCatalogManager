import { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";

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

// Custom node component with proper typing
function LineageNodeComponent({ data }: { data: { label: string; type: string; metadata?: LineageMetadata } }) {
  const getNodeStyle = (type: string) => {
    const baseStyle = {
      padding: '16px',
      border: '2px solid',
      borderRadius: '8px',
      minWidth: '180px',
      transition: 'all 0.2s ease',
    };

    switch (type) {
      case 'source':
        return {
          ...baseStyle,
          background: '#4CAF50',
          color: 'white',
          borderColor: '#43A047',
          boxShadow: '0 0 0 1px rgba(76, 175, 80, 0.2)',
        };
      case 'transformation':
        return {
          ...baseStyle,
          background: '#2196F3',
          color: 'white',
          borderColor: '#1E88E5',
          boxShadow: '0 0 0 1px rgba(33, 150, 243, 0.2)',
        };
      case 'target':
        return {
          ...baseStyle,
          background: '#F44336',
          color: 'white',
          borderColor: '#E53935',
          boxShadow: '0 0 0 1px rgba(244, 67, 54, 0.2)',
        };
      default:
        return baseStyle;
    }
  };

  const formatMetadataValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return String(value);
  };

  return (
    <div style={getNodeStyle(data.type)} className="group relative">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-white !border-2 !border-current" 
      />
      <div className="text-center">
        <div className="font-medium mb-1">{data.label}</div>
        <div className="text-xs text-white/80">
          {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
        </div>
        {data.metadata && (
          <div className="absolute invisible group-hover:visible bg-popover text-popover-foreground p-3 rounded-md -top-16 left-1/2 transform -translate-x-1/2 w-56 z-10 shadow-md">
            <div className="text-xs space-y-1">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span>{' '}
                  <span className="text-muted-foreground">{formatMetadataValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-white !border-2 !border-current" 
      />
    </div>
  );
}

const nodeTypes = {
  custom: LineageNodeComponent,
};

// Generate a unique edge ID
const generateEdgeId = (source: string, target: string): string => {
  return `edge-${source}-${target}`;
};

export default function ReactFlowLineage({ dataProductId, lineageData, isLoading }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!lineageData) return;

    // Calculate layout positions
    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 120;
    const INITIAL_X = 50;
    const INITIAL_Y = 50;

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

    // Create nodes with positions
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
        },
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
        },
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
        },
      })),
    ];

    // Create a Map to deduplicate edges
    const uniqueEdgesMap = new Map();
    lineageData.links.forEach(link => {
      const edgeKey = `${link.source}-${link.target}`;
      uniqueEdgesMap.set(edgeKey, link);
    });

    // Create edges from unique links
    const flowEdges = Array.from(uniqueEdgesMap.values()).map(link => ({
      id: generateEdgeId(link.source, link.target),
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      label: link.transformationLogic,
      labelStyle: { fill: '#666', fontWeight: 500 },
      style: {
        stroke: '#666',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#666',
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [lineageData, setNodes, setEdges]);

  return (
    <Card className="w-full h-[600px]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="space-y-4 w-full p-8">
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
          />
          <MiniMap 
            nodeStrokeColor="hsl(var(--muted-foreground))"
            nodeColor={node => {
              switch (node.data?.type) {
                case "source":
                  return "hsl(142.1 70.6% 45.3%)"; // Darker green for better contrast
                case "transformation":
                  return "hsl(217.2 91.2% 59.8%)"; // Adjusted blue
                case "target":
                  return "hsl(0 84.2% 60.2%)"; // Adjusted red
                default:
                  return "hsl(var(--muted))";
              }
            }}
            maskColor="hsl(var(--background) / 0.7)" // Adjusted opacity for better contrast
            style={{
              backgroundColor: "hsl(var(--card) / 0.8)", // Slightly transparent background
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "0 2px 4px hsl(var(--background) / 0.1)", // Subtle shadow
            }}
            className="!bottom-24 transition-colors duration-200" // Added transition for theme changes
            position="bottom-right"
          />
        </ReactFlow>
      )}
    </Card>
  );
}