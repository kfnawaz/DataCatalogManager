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
  const style = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    background: data.type === 'source' ? '#4CAF50' :
                data.type === 'transformation' ? '#2196F3' :
                data.type === 'target' ? '#F44336' : '#9E9E9E',
    color: 'white',
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
    <div style={style} className="relative group">
      <Handle type="target" position={Position.Left} />
      <div>
        {data.label}
        {data.metadata && (
          <div className="absolute invisible group-hover:visible bg-black/80 text-white p-2 rounded-md -top-12 left-1/2 transform -translate-x-1/2 w-48 z-10">
            <div className="text-xs">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={`${key}-${String(value)}`} className="mb-1">
                  <span className="font-semibold">{key}:</span> {formatMetadataValue(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
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
    const HORIZONTAL_SPACING = 200;
    const VERTICAL_SPACING = 100;
    const INITIAL_X = 50;
    const INITIAL_Y = 50;

    // Group nodes by type to create layers
    const sourceNodes = lineageData.nodes.filter(n => n.type === 'source');
    const transformNodes = lineageData.nodes.filter(n => n.type === 'transformation');
    const targetNodes = lineageData.nodes.filter(n => n.type === 'target');

    // Create nodes with positions and guaranteed unique IDs
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

    // Create edges with unique IDs
    const flowEdges: Edge[] = lineageData.links.map((link) => {
      const sourceId = `${link.source}-${lineageData.nodes.find(n => n.id === link.source)?.type}`;
      const targetId = `${link.target}-${lineageData.nodes.find(n => n.id === link.target)?.type}`;

      return {
        id: generateEdgeId(sourceId, targetId),
        source: sourceId,
        target: targetId,
        animated: true,
        label: link.transformationLogic,
        style: { stroke: '#666' },
        type: 'smoothstep',
        data: link.metadata,
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
        >
          <Background />
          <Controls />
        </ReactFlow>
      )}
    </Card>
  );
}