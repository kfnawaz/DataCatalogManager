import { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  Node,
  Position,
  useNodesState,
  useEdgesState,
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
        return {
          ...baseStyle,
          background: '#9E9E9E',
          color: 'white',
          borderColor: '#757575',
          boxShadow: '0 0 0 1px rgba(158, 158, 158, 0.2)',
        };
    }
  };

  // Format metadata values with type safety
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

// Generate a unique edge ID using UUID-like timestamp
const generateEdgeId = (source: string, target: string): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `edge-${source}-${target}-${timestamp}-${random}`;
};

export default function ReactFlowLineage({ dataProductId, lineageData, isLoading }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Transform data when it's loaded
  useEffect(() => {
    if (!lineageData) return;

    // Calculate layout positions
    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 120;
    const INITIAL_X = 50;
    const INITIAL_Y = 50;

    // Deduplicate nodes by ID
    const uniqueNodes = Array.from(
      new Map(lineageData.nodes.map(node => [node.id, node])).values()
    );

    // Group nodes by type to create layers
    const sourceNodes = uniqueNodes.filter(n => n.type === 'source');
    const transformNodes = uniqueNodes.filter(n => n.type === 'transformation');
    const targetNodes = uniqueNodes.filter(n => n.type === 'target');

    // Create nodes with positions
    const flowNodes: Node[] = [
      ...sourceNodes.map((node, i) => ({
        id: `${node.id}-${node.type}`,
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
        id: `${node.id}-${node.type}`,
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
        id: `${node.id}-${node.type}`,
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

    // Deduplicate links based on source and target combination
    const uniqueLinks = Array.from(
      new Map(lineageData.links.map(link => [`${link.source}-${link.target}`, link])).values()
    );

    // Create edges with unique IDs
    const flowEdges = uniqueLinks.map((link) => {
      const sourceId = `${link.source}-${uniqueNodes.find(n => n.id === link.source)?.type}`;
      const targetId = `${link.target}-${uniqueNodes.find(n => n.id === link.target)?.type}`;

      return {
        id: generateEdgeId(sourceId, targetId),
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: true,
        label: link.transformationLogic,
        labelStyle: { fill: '#666', fontWeight: 500 },
        style: {
          stroke: '#666',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#666',
          width: 20,
          height: 20,
        },
      };
    });

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
            style: { stroke: '#666', strokeWidth: 2 },
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      )}
    </Card>
  );
}