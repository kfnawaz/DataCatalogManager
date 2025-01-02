import { useEffect, useMemo } from 'react';
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

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  // Create a map of node levels
  const levels = new Map<string, number>();
  const processedNodes = new Set<string>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Helper function to calculate node depths
  function calculateDepth(nodeId: string, currentDepth: number = 0) {
    if (processedNodes.has(nodeId)) return;
    processedNodes.add(nodeId);

    const currentLevel = levels.get(nodeId) ?? -1;
    levels.set(nodeId, Math.max(currentLevel, currentDepth));

    // Find all outgoing edges from this node
    const outgoingEdges = edges.filter(e => e.source === nodeId);
    outgoingEdges.forEach(edge => {
      calculateDepth(edge.target, currentDepth + 1);
    });
  }

  // Find root nodes (nodes with no incoming edges)
  const rootNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );

  // Calculate depths starting from root nodes
  rootNodes.forEach(node => calculateDepth(node.id));

  // Group nodes by level
  const nodesPerLevel = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    const levelNodes = nodesPerLevel.get(level) || [];
    levelNodes.push(nodeId);
    nodesPerLevel.set(level, levelNodes);
  });

  // Calculate positions
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 120;
  const CENTER_Y = 300;

  const positionedNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const levelNodes = nodesPerLevel.get(level) || [];
    const index = levelNodes.indexOf(node.id);
    const totalNodesInLevel = levelNodes.length;

    // Calculate vertical position to center nodes in their level
    const y = CENTER_Y + (index - (totalNodesInLevel - 1) / 2) * VERTICAL_SPACING;

    return {
      ...node,
      position: {
        x: level * HORIZONTAL_SPACING + 50,
        y
      }
    };
  });

  return { nodes: positionedNodes, edges };
}

function generateUniqueEdgeId(source: string, target: string, index: number, transformationLogic?: string): string {
  // Include a hash of the transformation logic if it exists to ensure uniqueness
  const logicHash = transformationLogic ? 
    transformationLogic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    '';
  return `edge-${source}-${target}-${logicHash}-${index}`;
}

export default function ReactFlowLineage({ dataProductId }: ReactFlowLineageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: lineageData, isLoading } = useQuery<LineageData>({
    queryKey: [`/api/lineage?dataProductId=${dataProductId}`],
    enabled: dataProductId !== null,
  });

  // Memoize flow elements to prevent unnecessary recalculations
  const flowElements = useMemo(() => {
    if (!lineageData?.nodes?.length) return { nodes: [], edges: [] };

    // Create a Map to store unique nodes by their ID and content
    const uniqueNodesMap = new Map();

    // Process nodes and ensure uniqueness
    lineageData.nodes.forEach(node => {
      const nodeKey = `${node.id}-${node.label}-${node.type}`;
      if (!uniqueNodesMap.has(nodeKey)) {
        uniqueNodesMap.set(nodeKey, {
          id: node.id,
          type: node.type,
          data: {
            label: node.label,
            metadata: node.metadata,
          },
          position: { x: 0, y: 0 },
        });
      }
    });

    // Convert unique nodes map to array
    const flowNodes = Array.from(uniqueNodesMap.values());

    // Create a Map to store unique edges
    const uniqueEdgesMap = new Map();

    // Process edges and ensure uniqueness
    lineageData.links.forEach((link, index) => {
      const edgeId = generateUniqueEdgeId(link.source, link.target, index, link.transformationLogic);

      if (!uniqueEdgesMap.has(edgeId)) {
        uniqueEdgesMap.set(edgeId, {
          id: edgeId,
          source: link.source,
          target: link.target,
          animated: true,
          label: link.transformationLogic,
          style: { stroke: '#666' },
          labelStyle: { fill: '#666', fontSize: 12 },
          type: 'smoothstep',
        });
      }
    });

    // Convert unique edges map to array
    const flowEdges = Array.from(uniqueEdgesMap.values());

    return getLayoutedElements(flowNodes, flowEdges);
  }, [lineageData]);

  // Update flow elements when they change
  useEffect(() => {
    if (flowElements.nodes.length > 0 || flowElements.edges.length > 0) {
      setNodes(flowElements.nodes);
      setEdges(flowElements.edges);
    }
  }, [flowElements, setNodes, setEdges]);

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