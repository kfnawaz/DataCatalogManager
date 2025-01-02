import { useCallback } from 'react';
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
  useCallback(() => {
    if (!lineageData) return;

    // Transform nodes
    const flowNodes: Node[] = lineageData.nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: { x: index * 200, y: 100 }, // Simple horizontal layout
      data: {
        label: node.label,
        type: node.type,
      },
    }));

    // Transform edges
    const flowEdges: Edge[] = lineageData.links.map((link, index) => ({
      id: `edge-${link.source}-${link.target}-${index}`,
      source: link.source,
      target: link.target,
      animated: true,
      label: link.transformationLogic,
      style: { stroke: '#666' },
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