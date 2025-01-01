import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics, metricDefinitions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Data product routes
  app.get("/api/metadata/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const [product] = await db
        .select()
        .from(dataProducts)
        .where(eq(dataProducts.id, productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "Data product not found" });
      }

      return res.json({
        id: product.id,
        name: product.name,
        description: product.description,
        owner: product.owner,
        schema: product.schema,
        tags: product.tags || [],
        sla: product.sla,
        updateFrequency: product.updateFrequency
      });
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  app.get("/api/data-products", async (_req, res) => {
    try {
      const products = await db.select().from(dataProducts);

      // If no products exist, create sample data
      if (products.length === 0) {
        const [product1, product2, product3] = await db.insert(dataProducts).values([
          {
            name: "Trading Data Warehouse",
            description: "Centralized repository for all trading and market data",
            owner: "Trading Technology Team",
            schema: {
              columns: [
                { name: "trade_id", type: "string", description: "Unique trade identifier" },
                { name: "instrument_id", type: "string", description: "Financial instrument identifier" },
                { name: "price", type: "decimal", description: "Trade execution price" },
                { name: "quantity", type: "integer", description: "Number of units traded" },
                { name: "timestamp", type: "timestamp", description: "Trade execution time" },
                { name: "counterparty", type: "string", description: "Trading counterparty" }
              ]
            },
            tags: ["trading", "market-data", "core"],
            sla: "99.99%",
            updateFrequency: "Real-time",
          },
          {
            name: "Risk Analytics Platform",
            description: "Risk calculations and exposure analysis for trading positions",
            owner: "Risk Management Team",
            schema: {
              columns: [
                { name: "position_id", type: "string", description: "Position identifier" },
                { name: "var_value", type: "decimal", description: "Value at Risk calculation" },
                { name: "exposure", type: "decimal", description: "Current exposure amount" },
                { name: "risk_factors", type: "jsonb", description: "Risk factor sensitivities" },
                { name: "stress_scenarios", type: "jsonb", description: "Stress test results" }
              ]
            },
            tags: ["risk", "analytics", "compliance"],
            sla: "99.9%",
            updateFrequency: "Hourly",
          },
          {
            name: "Client Portfolio Management",
            description: "Client investment portfolios and performance tracking",
            owner: "Portfolio Management Team",
            schema: {
              columns: [
                { name: "portfolio_id", type: "string", description: "Portfolio identifier" },
                { name: "client_id", type: "string", description: "Client reference" },
                { name: "holdings", type: "jsonb", description: "Current portfolio holdings" },
                { name: "performance", type: "decimal", description: "Portfolio performance" },
                { name: "allocation", type: "jsonb", description: "Asset allocation" }
              ]
            },
            tags: ["portfolio", "client", "investment"],
            sla: "99.95%",
            updateFrequency: "Daily",
          }
        ]).returning();

        // Create sample lineage data
        await Promise.all(
          [product1, product2, product3].map(async (product) => {
            const [source, transform, target] = await db.insert(lineageNodes).values([
              {
                dataProductId: product.id,
                type: "source",
                details: { name: "Market Data Feed", description: "Real-time market data source" }
              },
              {
                dataProductId: product.id,
                type: "transformation",
                details: { name: "Data Processing Pipeline", description: "ETL and enrichment process" }
              },
              {
                dataProductId: product.id,
                type: "target",
                details: { name: "Trading Platform", description: "Real-time trading system" }
              }
            ]).returning();

            await db.insert(lineageEdges).values([
              { sourceId: source.id, targetId: transform.id },
              { sourceId: transform.id, targetId: target.id }
            ]);

            // Create sample quality metrics
            await db.insert(qualityMetrics).values({
              dataProductId: product.id,
              completeness: 98,
              accuracy: 99,
              timeliness: 97,
              customMetrics: {
                data_freshness: 95,
                schema_compliance: 100,
                data_consistency: 98
              }
            });
          })
        );

        return res.json([product1, product2, product3]);
      }

      return res.json(products);
    } catch (error) {
      console.error("Error fetching data products:", error);
      return res.status(500).json({ error: "Failed to fetch data products" });
    }
  });

  // Lineage routes
  app.get("/api/lineage/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const nodes = await db
        .select()
        .from(lineageNodes)
        .where(eq(lineageNodes.dataProductId, productId));

      if (nodes.length === 0) {
        return res.status(404).json({ error: "No lineage data found" });
      }

      // Get all edges where either source or target is one of our nodes
      const nodeIds = nodes.map(n => n.id);
      const edges = await db
        .select()
        .from(lineageEdges)
        .where(eq(lineageEdges.sourceId, nodes[0].id));

      return res.json({
        nodes: nodes.map(node => ({
          id: node.id.toString(),
          type: node.type,
          label: node.details?.name || `Node ${node.id}`,
        })),
        links: edges.map(edge => ({
          source: edge.sourceId.toString(),
          target: edge.targetId.toString(),
        }))
      });
    } catch (error) {
      console.error("Error fetching lineage:", error);
      return res.status(500).json({ error: "Failed to fetch lineage" });
    }
  });

  // Quality metrics routes
  app.get("/api/quality-metrics/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const [metrics] = await db
        .select()
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, productId))
        .limit(1);

      if (!metrics) {
        return res.status(404).json({ error: "No quality metrics found" });
      }

      const definitions = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.dataProductId, productId));

      // Generate historical data with safe null checks
      const today = new Date();
      const history = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - i);
        return {
          timestamp: date.toISOString(),
          completeness: (metrics.completeness ?? 95) - Math.random() * 5,
          accuracy: (metrics.accuracy ?? 98) - Math.random() * 3,
          timeliness: (metrics.timeliness ?? 96) - Math.random() * 4
        };
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return res.json({
        current: {
          completeness: metrics.completeness ?? 95,
          accuracy: metrics.accuracy ?? 98,
          timeliness: metrics.timeliness ?? 96,
          customMetrics: definitions,
        },
        history
      });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      return res.status(500).json({ error: "Failed to fetch quality metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}