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
import { VisuallyHidden } from "@/components/ui/visually-hidden";

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
  version: number;
  versions: { version: number; timestamp: string }[];
}

// Custom node types
const sourceStyle = { background: '#4CAF50', color: 'white' };
const transformStyle = { background: '#2196F3', color: 'white' };
const targetStyle = { background: '#F44336', color: 'white' };

function LineageNodeComponent({ data, type }: { data: any; type: string }) {
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
  source: LineageNodeComponent,
  transformation: LineageNodeComponent,
  target: LineageNodeComponent,
};

// Enhanced layout function with better node positioning
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const levels: { [key: string]: number } = {};
  const processedNodes = new Set<string>();

  // Calculate node levels based on dependencies
  function calculateLevels(nodeId: string, level: number) {
    if (processedNodes.has(nodeId)) return;
    processedNodes.add(nodeId);
    levels[nodeId] = Math.max(level, levels[nodeId] || 0);

    // Find all target nodes connected to this node
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        calculateLevels(edge.target, level + 1);
      }
    });
  }

  // Start with source nodes (nodes with no incoming edges)
  const sourceNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );

  sourceNodes.forEach(node => calculateLevels(node.id, 0));

  // Calculate max nodes per level
  const nodesPerLevel: { [level: number]: number } = {};
  Object.entries(levels).forEach(([nodeId, level]) => {
    nodesPerLevel[level] = (nodesPerLevel[level] || 0) + 1;
  });

  // Position nodes with proper spacing
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 100;
  const updatedNodes = nodes.map(node => {
    const level = levels[node.id] || 0;
    const nodesInLevel = nodesPerLevel[level];
    const indexInLevel = Object.entries(levels)
      .filter(([, l]) => l === level)
      .findIndex(([id]) => id === node.id);

    return {
      ...node,
      position: {
        x: level * HORIZONTAL_SPACING + 50,
        y: (indexInLevel - (nodesInLevel - 1) / 2) * VERTICAL_SPACING + 300,
      },
    };
  });

  return { nodes: updatedNodes, edges };
}

export default function ReactFlowLineage({ dataProductId }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: lineageData, isLoading } = useQuery<LineageData>({
    queryKey: [`/api/lineage?dataProductId=${dataProductId}`],
    enabled: dataProductId !== null,
  });

  // Transform data for React Flow whenever lineageData changes
  useEffect(() => {
    if (!lineageData?.nodes?.length) return;

    // Create flow nodes with unique IDs
    const flowNodes: Node[] = lineageData.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      data: {
        label: node.label,
        metadata: node.metadata,
      },
      position: { x: 0, y: 0 }, // Initial positions will be set by layout function
    }));

    // Create edges with unique IDs
    const flowEdges: Edge[] = lineageData.links.map((link, index) => ({
      id: `edge-${link.source}-${link.target}`,
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

    // Clear previous state and set new nodes/edges
    setNodes([]);
    setEdges([]);
    setTimeout(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }, 0);
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