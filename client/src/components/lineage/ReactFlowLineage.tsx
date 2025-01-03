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
import { Skeleton } from "@/components/ui/skeleton";

interface ReactFlowLineageProps {
  dataProductId: number | null;
  lineageData: {
    nodes: Array<{
      id: string;
      type: 'source' | 'transformation' | 'target';
      label: string;
      metadata?: Record<string, any>;
    }>;
    links: Array<{
      source: string;
      target: string;
      transformationLogic?: string;
    }>;
  } | null;
  isLoading: boolean;
}

// Custom node component
function LineageNodeComponent({ data }: { data: { label: string; type: string; metadata?: Record<string, any> } }) {
  const style = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    background: data.type === 'source' ? '#4CAF50' :
                data.type === 'transformation' ? '#2196F3' :
                data.type === 'target' ? '#F44336' : '#9E9E9E',
    color: 'white',
  };

  // Format metadata values with improved readability
  const formatMetadataValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return String(value);
  };

  // Format dates if present in metadata
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={style} className="relative group">
      <Handle type="target" position={Position.Left} />
      <div>
        {data.label}
        {data.metadata && (
          <div className="absolute invisible group-hover:visible bg-black/90 text-white p-3 rounded-lg -top-4 left-1/2 transform -translate-x-1/2 -translate-y-full w-64 z-10 shadow-lg">
            <div className="text-xs space-y-2">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key} className="border-b border-gray-700 pb-1 last:border-0">
                  <span className="font-semibold text-gray-300">{key}:</span>
                  <div className="mt-0.5 text-gray-100 whitespace-pre-line">
                    {key.toLowerCase().includes('date') ? formatDate(String(value)) : formatMetadataValue(value)}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="border-8 border-transparent border-t-black/90" />
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

    // Create nodes with positions
    const flowNodes: Node[] = [
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

    // Create edges with unique IDs
    const flowEdges: Edge[] = lineageData.links.map((link, index) => ({
      id: `edge-${link.source}-${link.target}-${index}`,
      source: link.source,
      target: link.target,
      animated: true,
      label: link.transformationLogic,
      style: { stroke: '#666' },
      type: 'smoothstep',
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [lineageData, setNodes, setEdges]);

  return (
    <Card className="w-full h-[600px]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="space-y-6 w-full max-w-3xl">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>

            {/* Nodes skeleton */}
            <div className="grid grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="relative">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Edge skeleton lines */}
            <div className="relative h-32">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="absolute h-0.5 w-1/3 transform rotate-45 origin-left"
                  style={{ top: `${i * 25}%`, left: '33%' }}
                />
              ))}
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