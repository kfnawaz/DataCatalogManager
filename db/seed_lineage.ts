import { db } from "@db";
import { lineageNodes, lineageEdges, lineageVersions, dataProducts, nodeQualityMetrics, metricDefinitions } from "@db/schema";
import { eq, or } from "drizzle-orm";

export async function seedLineageData() {
  try {
    console.log("Starting VaR Report lineage seeding...");

    // First clean up any existing data
    await db.delete(nodeQualityMetrics);
    await db.delete(lineageEdges);
    await db.delete(lineageNodes);
    await db.delete(lineageVersions);

    // Remove any existing VaR Report products
    await db
      .delete(dataProducts)
      .where(eq(dataProducts.name, "VaR Report"));

    // Create the VaR Report data product
    const [varReportProduct] = await db
      .insert(dataProducts)
      .values({
        name: "VaR Report",
        description: "Value at Risk (VaR) reporting system with data quality tracking",
        owner: "Risk Management Team",
        domain: "Risk Analytics",
        schema: {
          type: "object",
          properties: {
            reportDate: { type: "string", format: "date" },
            portfolioVaR: { type: "number" },
            confidenceLevel: { type: "number" },
            timeHorizon: { type: "string" }
          },
          required: ["reportDate", "portfolioVaR", "confidenceLevel", "timeHorizon"]
        },
        tags: ["risk", "var", "reporting", "regulatory"],
        sla: "99.9%",
        updateFrequency: "Daily"
      })
      .returning();

    console.log("Created VaR Report data product");

    // Create the lineage nodes with proper relationships
    const nodes = await db
      .insert(lineageNodes)
      .values([
        {
          name: "Market Data Feed",
          type: "source-aligned",
          dataProductId: varReportProduct.id,
          metadata: {
            description: "Real-time market data feed for pricing and risk factors",
            format: "JSON",
            frequency: "Real-time",
            owner: "Market Data Team",
            sla: "99.99% availability"
          }
        },
        {
          name: "Position Data",
          type: "source-aligned",
          dataProductId: varReportProduct.id,
          metadata: {
            description: "Current trading positions and portfolio holdings",
            format: "CSV",
            frequency: "Daily",
            owner: "Trading Systems Team",
            sla: "99.9% availability"
          }
        },
        {
          name: "Risk Calculator",
          type: "aggregate",
          dataProductId: varReportProduct.id,
          metadata: {
            description: "VaR calculation engine using historical simulation",
            algorithm: "Historical simulation",
            parameters: {
              confidenceLevel: 0.99,
              timeHorizon: "10D",
              lookbackPeriod: "252D"
            },
            owner: "Risk Analytics Team",
            sla: "99.5% availability"
          }
        },
        {
          name: "VaR Report Generator",
          type: "consumer-aligned",
          dataProductId: varReportProduct.id,
          metadata: {
            description: "Daily VaR report generation system",
            format: "PDF",
            distribution: ["Email", "SharePoint"],
            owner: "Risk Management Team",
            sla: "99.9% availability",
            recipients: ["Risk Committee", "Trading Desk", "Compliance"]
          }
        }
      ])
      .returning();

    console.log("Created lineage nodes");

    // Create edges between nodes with clear transformation logic
    await db
      .insert(lineageEdges)
      .values([
        {
          sourceId: nodes[0].id, // Market Data Feed
          targetId: nodes[2].id, // Risk Calculator
          transformationLogic: `
            1. Fetch real-time market data
            2. Apply market scenarios
            3. Calculate price changes
            4. Format for risk calculations`,
          metadata: {
            dataVolume: "~1M records/day",
            latency: "<100ms",
            type: "data_flow",
            validation: ["price range checks", "timestamp validation"]
          }
        },
        {
          sourceId: nodes[1].id, // Position Data
          targetId: nodes[2].id, // Risk Calculator
          transformationLogic: `
            1. Load daily positions
            2. Apply position filters
            3. Calculate position weights
            4. Aggregate by risk factors`,
          metadata: {
            dataVolume: "~100K records/day",
            latency: "<50ms",
            type: "data_flow",
            validation: ["position reconciliation", "currency validation"]
          }
        },
        {
          sourceId: nodes[2].id, // Risk Calculator
          targetId: nodes[3].id, // VaR Report Generator
          transformationLogic: `
            1. Calculate portfolio VaR
            2. Generate risk metrics
            3. Create visualization data
            4. Format report content`,
          metadata: {
            format: "PDF",
            schedule: "Daily @ 18:00 UTC",
            type: "data_flow",
            validation: ["VaR bounds check", "historical comparison"]
          }
        }
      ]);

    console.log("Created lineage edges");

    // Create initial version snapshot
    const snapshot = {
      nodes: nodes.map(node => ({
        id: node.id.toString(),
        type: node.type,
        label: node.name,
        metadata: node.metadata
      })),
      edges: [
        {
          source: nodes[0].id.toString(),
          target: nodes[2].id.toString(),
          transformationLogic: "Market data processing and scenario generation",
          metadata: {
            dataVolume: "~1M records/day",
            latency: "<100ms",
            type: "data_flow"
          }
        },
        {
          source: nodes[1].id.toString(),
          target: nodes[2].id.toString(),
          transformationLogic: "Position aggregation and weight calculation",
          metadata: {
            dataVolume: "~100K records/day",
            latency: "<50ms",
            type: "data_flow"
          }
        },
        {
          source: nodes[2].id.toString(),
          target: nodes[3].id.toString(),
          transformationLogic: "VaR calculation and report generation",
          metadata: {
            format: "PDF",
            schedule: "Daily @ 18:00 UTC",
            type: "data_flow"
          }
        }
      ]
    };

    await db
      .insert(lineageVersions)
      .values({
        dataProductId: varReportProduct.id,
        version: 1,
        snapshot,
        changeMessage: "Initial VaR Report lineage setup with quality metrics",
        createdBy: "system"
      });

    console.log("Created lineage version snapshot");

    // Get metric definitions for quality metrics
    const metricDefs = await db
      .select()
      .from(metricDefinitions)
      .where(
        or(
          eq(metricDefinitions.type, "completeness"),
          eq(metricDefinitions.type, "accuracy"),
          eq(metricDefinitions.type, "timeliness")
        )
      );

    // Add quality metrics for each node
    for (const node of nodes) {
      const metrics = metricDefs.map(def => ({
        nodeId: node.id,
        metricDefinitionId: def.id,
        value: 85 + Math.floor(Math.random() * 15), // Random value between 85-99
        metadata: {
          timestamp: new Date().toISOString(),
          calculator: "system",
          validation: "automated"
        }
      }));

      await db.insert(nodeQualityMetrics).values(metrics);
    }

    console.log("Added node quality metrics");
    console.log("Successfully seeded lineage data with quality metrics");
  } catch (error) {
    console.error("Error seeding lineage data:", error);
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedLineageData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}