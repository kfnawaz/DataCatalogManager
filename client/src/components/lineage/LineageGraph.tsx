import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactFlowLineage from "./ReactFlowLineage";

interface LineageGraphProps {
  dataProductId: number | null;
}

interface LineageData {
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
  version: number;
  versions: { version: number; timestamp: string }[];
}

export default function LineageGraph({ dataProductId }: LineageGraphProps) {
  const { data: lineageData, isLoading } = useQuery<LineageData>({
    queryKey: [`/api/lineage?dataProductId=${dataProductId}`],
    enabled: dataProductId !== null,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Data Lineage</h2>

          {/* Legend */}
          <div className="flex items-center gap-4 border-l pl-4">
            <div className="flex items-center gap-2" role="presentation">
              <div className="w-3 h-3 rounded-full bg-[#4CAF50]" aria-hidden="true" />
              <span className="text-sm">Source</span>
            </div>
            <div className="flex items-center gap-2" role="presentation">
              <div className="w-3 h-3 rounded-full bg-[#2196F3]" aria-hidden="true" />
              <span className="text-sm">Transformation</span>
            </div>
            <div className="flex items-center gap-2" role="presentation">
              <div className="w-3 h-3 rounded-full bg-[#F44336]" aria-hidden="true" />
              <span className="text-sm">Target</span>
            </div>
          </div>
        </div>
      </div>

      <ReactFlowLineage 
        dataProductId={dataProductId} 
        lineageData={lineageData || null}
        isLoading={isLoading}
      />
    </div>
  );
}