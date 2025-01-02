import { db } from "@db";
import { lineageNodes, lineageEdges, lineageVersions } from "@db/schema";

export async function seedLineageData() {
  try {
    // Sample nodes for the VaR Report data product (assuming ID 1)
    const nodes = await db
      .insert(lineageNodes)
      .values([
        {
          name: "Market Data",
          type: "source",
          dataProductId: 1,
          metadata: {
            description: "Real-time market data feed",
            format: "JSON",
            frequency: "Real-time"
          }
        },
        {
          name: "Position Data",
          type: "source",
          dataProductId: 1,
          metadata: {
            description: "Current trading positions",
            format: "CSV",
            frequency: "Daily"
          }
        },
        {
          name: "Risk Calculator",
          type: "transformation",
          dataProductId: 1,
          metadata: {
            description: "VaR calculation engine",
            algorithm: "Historical simulation",
            parameters: {
              confidenceLevel: 0.99,
              timeHorizon: "10D"
            }
          }
        },
        {
          name: "VaR Report",
          type: "target",
          dataProductId: 1,
          metadata: {
            description: "Daily VaR report",
            format: "PDF",
            distribution: "Email"
          }
        }
      ])
      .returning();

    // Create edges between nodes
    await db
      .insert(lineageEdges)
      .values([
        {
          sourceId: nodes[0].id, // Market Data -> Risk Calculator
          targetId: nodes[2].id,
          transformationLogic: "Apply market scenarios and calculate price changes",
          metadata: {
            dataVolume: "~1M records/day",
            latency: "<100ms"
          }
        },
        {
          sourceId: nodes[1].id, // Position Data -> Risk Calculator
          targetId: nodes[2].id,
          transformationLogic: "Apply position weights and aggregation",
          metadata: {
            dataVolume: "~100K records/day",
            latency: "<50ms"
          }
        },
        {
          sourceId: nodes[2].id, // Risk Calculator -> VaR Report
          targetId: nodes[3].id,
          transformationLogic: "Generate formatted report with charts and analysis",
          metadata: {
            format: "PDF",
            schedule: "Daily @ 18:00"
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
            latency: "<100ms"
          }
        },
        {
          source: nodes[1].id.toString(),
          target: nodes[2].id.toString(),
          transformationLogic: "Apply position weights and aggregation",
          metadata: {
            dataVolume: "~100K records/day",
            latency: "<50ms"
          }
        },
        {
          source: nodes[2].id.toString(),
          target: nodes[3].id.toString(),
          transformationLogic: "Generate formatted report with charts and analysis",
          metadata: {
            format: "PDF",
            schedule: "Daily @ 18:00"
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
        changeMessage: "Initial lineage setup",
        createdBy: "system"
      });

    console.log("Successfully seeded lineage data");
  } catch (error) {
    console.error("Error seeding lineage data:", error);
    throw error;
  }
}
