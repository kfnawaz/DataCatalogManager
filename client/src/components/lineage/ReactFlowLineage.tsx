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
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ReactFlowLineageProps {
  dataProductId: number | null;
}

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

interface LineageData {
  nodes: LineageNode[];
  links: LineageLink[];
}

// Custom node component
function LineageNodeComponent({ data }: { data: { label: string; type: string } }) {
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
    <div style={style}>
      <Handle type="target" position={Position.Left} />
      {data.label}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  custom: LineageNodeComponent,
};

export default function ReactFlowLineage({ dataProductId }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: lineageData, isLoading } = useQuery<LineageData>({
    queryKey: [`/api/lineage?dataProductId=${dataProductId}`],
    enabled: dataProductId !== null,
  });

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
  }, [lineageData, setNodes, setEdges]);

  if (!dataProductId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select a data product to view its lineage
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <Card className="w-full h-[600px]">
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
    </Card>
  );
}