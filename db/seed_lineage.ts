import { db } from "@db";
import { lineageNodes, lineageEdges, lineageVersions } from "@db/schema";

export async function seedLineageData() {
  try {
    // Sample nodes for the financial data products with Data Mesh architecture
    const nodes = await db
      .insert(lineageNodes)
      .values([
        {
          name: "Market Data",
          type: "source-aligned",
          dataProductId: 1,
          metadata: {
            description: "Real-time market data feed",
            format: "JSON",
            frequency: "Real-time",
            owner: "Market Data Team",
            sla: "99.99% availability",
            qualityMetrics: {
              accuracy: 0.99,
              completeness: 0.98,
              timeliness: 0.99
            }
          }
        },
        {
          name: "Position Data",
          type: "source-aligned",
          dataProductId: 1,
          metadata: {
            description: "Current trading positions",
            format: "CSV",
            frequency: "Daily",
            owner: "Trading Systems Team",
            sla: "99.9% availability",
            qualityMetrics: {
              accuracy: 0.98,
              completeness: 0.95,
              timeliness: 0.97
            }
          }
        },
        {
          name: "Risk Calculator",
          type: "aggregate",
          dataProductId: 1,
          metadata: {
            description: "VaR calculation engine",
            algorithm: "Historical simulation",
            parameters: {
              confidenceLevel: 0.99,
              timeHorizon: "10D"
            },
            owner: "Risk Analytics Team",
            sla: "99.5% availability",
            qualityMetrics: {
              accuracy: 0.97,
              completeness: 0.96,
              timeliness: 0.95
            }
          }
        },
        {
          name: "VaR Report",
          type: "consumer-aligned",
          dataProductId: 1,
          metadata: {
            description: "Daily VaR report",
            format: "PDF",
            distribution: "Email",
            owner: "Risk Management Team",
            sla: "99.9% availability",
            qualityMetrics: {
              accuracy: 0.95,
              completeness: 0.98,
              timeliness: 0.96
            }
          }
        }
      ])
      .returning();

    // Create edges between nodes with transformation metadata
    await db
      .insert(lineageEdges)
      .values([
        {
          sourceId: nodes[0].id,
          targetId: nodes[2].id,
          transformationLogic: "Apply market scenarios and calculate price changes",
          metadata: {
            dataVolume: "~1M records/day",
            latency: "<100ms",
            type: "data_flow"
          }
        },
        {
          sourceId: nodes[1].id,
          targetId: nodes[2].id,
          transformationLogic: "Apply position weights and aggregation",
          metadata: {
            dataVolume: "~100K records/day",
            latency: "<50ms",
            type: "data_flow"
          }
        },
        {
          sourceId: nodes[2].id,
          targetId: nodes[3].id,
          transformationLogic: "Generate formatted report with charts and analysis",
          metadata: {
            format: "PDF",
            schedule: "Daily @ 18:00",
            type: "data_flow"
          }
        }
      ]);

    // Create initial version snapshot
    const snapshot = {
      nodes: nodes.map(node => ({
        id: node.id.toString(),
        type: node.type,
        label: node.name,
        metadata: node.metadata
      })),
      links: [
        {
          source: nodes[0].id.toString(),
          target: nodes[2].id.toString(),
          transformationLogic: "Apply market scenarios and calculate price changes",
          metadata: {
            dataVolume: "~1M records/day",
            latency: "<100ms",
            type: "data_flow"
          }
        },
        {
          source: nodes[1].id.toString(),
          target: nodes[2].id.toString(),
          transformationLogic: "Apply position weights and aggregation",
          metadata: {
            dataVolume: "~100K records/day",
            latency: "<50ms",
            type: "data_flow"
          }
        },
        {
          source: nodes[2].id.toString(),
          target: nodes[3].id.toString(),
          transformationLogic: "Generate formatted report with charts and analysis",
          metadata: {
            format: "PDF",
            schedule: "Daily @ 18:00",
            type: "data_flow"
          }
        }
      ]
    };

    await db
      .insert(lineageVersions)
      .values({
        dataProductId: 1,
        version: 1,
        snapshot,
        changeMessage: "Initial Data Mesh aligned lineage setup",
        createdBy: "system"
      });

    console.log("Successfully seeded lineage data");
  } catch (error) {
    console.error("Error seeding lineage data:", error);
    throw error;
  }
}