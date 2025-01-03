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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Papa from 'papaparse';

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

// Format metadata for display
const formatMetadataForDisplay = (metadata: LineageMetadata): JSX.Element => {
  return (
    <div className="space-y-2 p-2">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="text-sm">
          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
          <span className="text-muted-foreground">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom node component with enhanced accessibility and tooltips
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

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div 
            style={getNodeStyle(data.type)} 
            className="group relative focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            role="button"
            tabIndex={0}
            aria-label={`${data.type} node: ${data.label}`}
          >
            <Handle 
              type="target" 
              position={Position.Left} 
              className="!bg-white !border-2 !border-current"
              aria-label="Input connection point" 
            />
            <div className="text-center">
              <div className="font-medium mb-1">{data.label}</div>
              <div className="text-xs text-white/80">
                {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
              </div>
            </div>
            <Handle 
              type="source" 
              position={Position.Right} 
              className="!bg-white !border-2 !border-current"
              aria-label="Output connection point"
            />
          </div>
        </TooltipTrigger>
        {data.metadata && (
          <TooltipContent side="top" align="center" className="max-w-sm">
            {formatMetadataForDisplay(data.metadata)}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

const nodeTypes = {
  custom: LineageNodeComponent,
};

// Generate a unique edge ID
const generateEdgeId = (source: string, target: string): string => {
  return `edge-${source}-${target}`;
};

const exportToPDF = (nodes: any[], edges: any[], dataProductId: number | null) => {
  const doc = new jsPDF();
  const title = `Data Lineage - Product ID: ${dataProductId}`;

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

  // Add nodes table
  const nodeRows = nodes.map(node => [
    node.id,
    node.data.label,
    node.data.type,
    node.data.metadata ? JSON.stringify(node.data.metadata) : ''
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['ID', 'Label', 'Type', 'Metadata']],
    body: nodeRows,
    headStyles: { fillColor: [41, 128, 185] },
    theme: 'striped',
  });

  // Add edges table
  const edgeRows = edges.map(edge => [
    edge.source,
    edge.target,
    edge.label || '',
    edge.data?.metadata ? JSON.stringify(edge.data.metadata) : ''
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Source', 'Target', 'Transformation', 'Metadata']],
    body: edgeRows,
    headStyles: { fillColor: [41, 128, 185] },
    theme: 'striped',
  });

  doc.save(`lineage-${dataProductId}-${new Date().toISOString().slice(0,10)}.pdf`);
};

const exportToCSV = (nodes: any[], edges: any[], dataProductId: number | null) => {
  // Prepare nodes data
  const nodesCSV = nodes.map(node => ({
    id: node.id,
    label: node.data.label,
    type: node.data.type,
    metadata: JSON.stringify(node.data.metadata || {})
  }));

  // Prepare edges data
  const edgesCSV = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    transformation: edge.label || '',
    metadata: JSON.stringify(edge.data?.metadata || {})
  }));

  // Create Blob for nodes
  const nodesBlob = new Blob([
    '\uFEFF' + // BOM for Excel
    Papa.unparse(nodesCSV)
  ], { type: 'text/csv;charset=utf-8;' });

  // Create Blob for edges
  const edgesBlob = new Blob([
    '\uFEFF' + // BOM for Excel
    Papa.unparse(edgesCSV)
  ], { type: 'text/csv;charset=utf-8;' });

  // Download files
  const downloadURL = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const timestamp = new Date().toISOString().slice(0,10);
  downloadURL(nodesBlob, `lineage-nodes-${dataProductId}-${timestamp}.csv`);
  downloadURL(edgesBlob, `lineage-edges-${dataProductId}-${timestamp}.csv`);
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
        ariaLabel: `Source node: ${node.label}`,
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
        ariaLabel: `Transformation node: ${node.label}`,
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
        ariaLabel: `Target node: ${node.label}`,
      })),
    ];

    // Create a Map to deduplicate edges
    const uniqueEdgesMap = new Map();
    lineageData.links.forEach(link => {
      const edgeKey = `${link.source}-${link.target}`;
      uniqueEdgesMap.set(edgeKey, link);
    });

    // Create edges from unique links with tooltips
    const flowEdges = Array.from(uniqueEdgesMap.values()).map(link => ({
      id: generateEdgeId(link.source, link.target),
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      label: link.transformationLogic,
      labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 500 },
      style: {
        stroke: 'hsl(var(--foreground))',
        strokeWidth: 2,
      },
      ariaLabel: `Connection from ${link.source} to ${link.target}${link.transformationLogic ? `: ${link.transformationLogic}` : ''}`,
      data: {
        metadata: link.metadata,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: 'hsl(var(--foreground))',
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [lineageData, setNodes, setEdges]);

  return (
    <Card className="w-full h-[600px]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="space-y-4 w-full p-8" role="alert" aria-live="polite">
            <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse">
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                Loading lineage data...
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                onClick={() => nodes && edges && exportToPDF(nodes, edges, dataProductId)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => nodes && edges && exportToCSV(nodes, edges, dataProductId)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
              className="bg-background"
              aria-label="Data lineage visualization"
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
                aria-label="Graph controls"
              />
              <MiniMap 
                nodeStrokeColor="hsl(var(--muted-foreground))"
                nodeColor={node => {
                  switch (node.data?.type) {
                    case "source":
                      return "hsl(142.1 70.6% 45.3%)";
                    case "transformation":
                      return "hsl(217.2 91.2% 59.8%)";
                    case "target":
                      return "hsl(0 84.2% 60.2%)";
                    default:
                      return "hsl(var(--muted))";
                  }
                }}
                maskColor="hsl(var(--background) / 0.7)"
                style={{
                  backgroundColor: "hsl(var(--card) / 0.8)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 2px 4px hsl(var(--background) / 0.1)",
                }}
                className="!bottom-24 transition-colors duration-200"
                position="bottom-right"
                aria-label="Minimap overview"
              />
            </ReactFlow>
          </div>
        </div>
      )}
    </Card>
  );
}