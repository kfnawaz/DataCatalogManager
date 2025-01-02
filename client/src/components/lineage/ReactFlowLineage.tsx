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

  return (
    <div style={style} className="relative group">
      <Handle type="target" position={Position.Left} />
      <div>
        {data.label}
        {data.metadata && (
          <div className="absolute invisible group-hover:visible bg-black/80 text-white p-2 rounded-md -top-12 left-1/2 transform -translate-x-1/2 w-48 z-10">
            <div className="text-xs">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key} className="mb-1">
                  <span className="font-semibold">{key}:</span> {value}
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

    // Create edges
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
  }, [lineageData]);

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