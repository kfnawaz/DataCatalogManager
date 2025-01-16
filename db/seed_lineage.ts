import { db } from "@db";
import { lineageNodes, lineageEdges, lineageVersions } from "@db/schema";

export async function seedLineageData() {
  try {
    // Sample nodes for the financial data products
    const nodes = await db
      .insert(lineageNodes)
      .values([
        {
          name: "Trading System Data",
          type: "source-aligned",
          dataProductId: 1,
          metadata: {
            owner: "Trading Systems Team",
            description: "Real-time trading data from multiple exchanges",
            format: "JSON/FIX Protocol",
            frequency: "Real-time",
            sla: "99.99% availability",
            qualityMetrics: {
              accuracy: 0.99,
              completeness: 0.98,
              timeliness: 0.99
            },
            schema: [
              { name: "trade_id", type: "string", description: "Unique trade identifier" },
              { name: "timestamp", type: "datetime", description: "Trade execution time" },
              { name: "price", type: "decimal", description: "Execution price" },
              { name: "volume", type: "decimal", description: "Trade volume" }
            ]
          }
        },
        {
          name: "Market Reference Data",
          type: "source-aligned",
          dataProductId: 1,
          metadata: {
            owner: "Market Data Team",
            description: "Reference data for financial instruments",
            format: "XML",
            frequency: "Daily",
            sla: "99.9% availability",
            qualityMetrics: {
              accuracy: 0.98,
              completeness: 0.95,
              timeliness: 0.97
            },
            schema: [
              { name: "instrument_id", type: "string", description: "Unique instrument identifier" },
              { name: "asset_class", type: "string", description: "Asset classification" },
              { name: "currency", type: "string", description: "Trading currency" }
            ]
          }
        },
        {
          name: "Aggregated Position Data",
          type: "aggregate",
          dataProductId: 1,
          metadata: {
            owner: "Risk Analytics Team",
            description: "Aggregated trading positions with risk metrics",
            format: "Parquet",
            frequency: "Hourly",
            sla: "99.5% availability",
            qualityMetrics: {
              accuracy: 0.97,
              completeness: 0.96,
              timeliness: 0.95
            },
            schema: [
              { name: "portfolio_id", type: "string", description: "Portfolio identifier" },
              { name: "position_value", type: "decimal", description: "Aggregated position value" },
              { name: "risk_metrics", type: "json", description: "Calculated risk metrics" }
            ]
          }
        },
        {
          name: "VaR Analytics Product",
          type: "consumer-aligned",
          dataProductId: 1,
          metadata: {
            owner: "Risk Management Team",
            description: "Value at Risk calculations for risk reporting",
            format: "JSON/REST API",
            frequency: "Daily",
            sla: "99.9% availability",
            qualityMetrics: {
              accuracy: 0.95,
              completeness: 0.98,
              timeliness: 0.96
            },
            schema: [
              { name: "var_metric", type: "decimal", description: "VaR calculation result" },
              { name: "confidence_level", type: "decimal", description: "Statistical confidence" },
              { name: "time_horizon", type: "string", description: "Calculation time horizon" }
            ]
          }
        }
      ])
      .returning();

    // Create edges between nodes with transformation metadata
    await db
      .insert(lineageEdges)
      .values([
        {
          sourceId: nodes[0].id, // Trading System Data -> Aggregated Position
          targetId: nodes[2].id,
          transformationLogic: "Position aggregation and risk calculation pipeline",
          metadata: {
            type: "batch-processing",
            frequency: "Hourly",
            dependencies: ["Apache Spark", "Risk Engine"],
            validationRules: [
              "No negative positions",
              "All mandatory fields present",
              "Timestamps within valid range"
            ],
            impact: "Critical - Core position calculation"
          }
        },
        {
          sourceId: nodes[1].id, // Market Reference -> Aggregated Position
          targetId: nodes[2].id,
          transformationLogic: "Instrument enrichment and classification",
          metadata: {
            type: "streaming",
            frequency: "Real-time",
            dependencies: ["Reference Data Service"],
            validationRules: [
              "Valid instrument IDs",
              "Required reference data present"
            ],
            impact: "High - Position classification"
          }
        },
        {
          sourceId: nodes[2].id, // Aggregated Position -> VaR Analytics
          targetId: nodes[3].id,
          transformationLogic: "VaR calculation using historical simulation",
          metadata: {
            type: "batch-processing",
            frequency: "Daily",
            dependencies: ["Statistical Engine", "Historical Data Store"],
            validationRules: [
              "Minimum data points requirement met",
              "Confidence level validation",
              "Time horizon validation"
            ],
            impact: "Critical - Risk measurement"
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
          transformationLogic: "Position aggregation and risk calculation pipeline",
          metadata: {
            type: "batch-processing",
            frequency: "Hourly",
            dependencies: ["Apache Spark", "Risk Engine"],
            validationRules: [
              "No negative positions",
              "All mandatory fields present",
              "Timestamps within valid range"
            ],
            impact: "Critical - Core position calculation"
          }
        },
        {
          source: nodes[1].id.toString(),
          target: nodes[2].id.toString(),
          transformationLogic: "Instrument enrichment and classification",
          metadata: {
            type: "streaming",
            frequency: "Real-time",
            dependencies: ["Reference Data Service"],
            validationRules: [
              "Valid instrument IDs",
              "Required reference data present"
            ],
            impact: "High - Position classification"
          }
        },
        {
          source: nodes[2].id.toString(),
          target: nodes[3].id.toString(),
          transformationLogic: "VaR calculation using historical simulation",
          metadata: {
            type: "batch-processing",
            frequency: "Daily",
            dependencies: ["Statistical Engine", "Historical Data Store"],
            validationRules: [
              "Minimum data points requirement met",
              "Confidence level validation",
              "Time horizon validation"
            ],
            impact: "Critical - Risk measurement"
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