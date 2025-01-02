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
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface ReactFlowLineageProps {
  dataProductId: number | null;
}

// Custom node types
const sourceStyle = { background: '#4CAF50', color: 'white' };
const transformStyle = { background: '#2196F3', color: 'white' };
const targetStyle = { background: '#F44336', color: 'white' };

function LineageNode({ data, type }: { data: any; type: string }) {
  let style = sourceStyle;
  if (type === 'transformation') style = transformStyle;
  if (type === 'target') style = targetStyle;

  return (
    <div
      className="px-4 py-2 shadow-lg rounded-md border-2 border-gray-200"
      style={style}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-500"
        aria-label="Input connection"
      />
      <div className="font-bold">{data.label}</div>
      {data.metadata && (
        <div className="text-xs mt-1 text-gray-100">
          {data.metadata.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-500"
        aria-label="Output connection"
      />
    </div>
  );
}

const nodeTypes = {
  source: LineageNode,
  transformation: LineageNode,
  target: LineageNode,
};

// Custom layout function
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const sourceNodes = nodes.filter(n => n.type === 'source');
  const transformNodes = nodes.filter(n => n.type === 'transformation');
  const targetNodes = nodes.filter(n => n.type === 'target');

  const columnSpacing = 300;
  const verticalSpacing = 150;
  const startX = 50;
  const startY = 50;

  // Position nodes in columns
  sourceNodes.forEach((node, i) => {
    node.position = {
      x: startX,
      y: startY + (i * verticalSpacing),
    };
  });

  transformNodes.forEach((node, i) => {
    node.position = {
      x: startX + columnSpacing,
      y: startY + (i * verticalSpacing),
    };
  });

  targetNodes.forEach((node, i) => {
    node.position = {
      x: startX + (columnSpacing * 2),
      y: startY + (i * verticalSpacing),
    };
  });

  return { nodes, edges };
}

export default function ReactFlowLineage({ dataProductId }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: lineageData, isLoading } = useQuery({
    queryKey: [`/api/lineage?dataProductId=${dataProductId}`],
    enabled: dataProductId !== null,
    onSuccess: (data: LineageData | undefined) => {
      if (!data?.nodes?.length) return;

      // Transform data for React Flow
      const flowNodes: Node[] = data.nodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        data: {
          label: node.label,
          metadata: node.metadata,
        },
        position: { x: 0, y: 0 },
      }));

      const flowEdges: Edge[] = data.links.map((link: any, index: number) => ({
        id: `edge-${index}`,
        source: link.source,
        target: link.target,
        animated: true,
        label: link.transformationLogic,
        style: { stroke: '#666' },
        labelStyle: { fill: '#666', fontSize: 12 },
        type: 'smoothstep',
      }));

      // Apply layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        flowNodes,
        flowEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
  });

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

interface LineageData {
  nodes: any[];
  links: any[];
  version: number;
  versions: { version: number; timestamp: string }[];
}