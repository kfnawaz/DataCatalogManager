import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics, metricDefinitions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Data product routes
  app.get("/api/data-products", async (_req, res) => {
    try {
      console.log("Fetching data products...");
      const products = await db.select().from(dataProducts);
      console.log("Found products:", products);

      // If no products exist, create sample data
      if (products.length === 0) {
        console.log("No products found, creating sample data...");
        const [product1, product2] = await db.insert(dataProducts).values([
          {
            name: "Customer Data Lake",
            description: "Central repository for all customer-related data",
            owner: "Data Engineering Team",
            schema: {
              columns: [
                { name: "customer_id", type: "string", description: "Unique identifier" },
                { name: "name", type: "string", description: "Customer name" },
                { name: "email", type: "string", description: "Email address" }
              ]
            },
            tags: ["customer", "core"],
            sla: "99.9%",
            updateFrequency: "Real-time",
          },
          {
            name: "Sales Analytics",
            description: "Sales performance metrics and analysis",
            owner: "Analytics Team",
            schema: {
              columns: [
                { name: "sale_id", type: "string", description: "Sale identifier" },
                { name: "amount", type: "number", description: "Sale amount" },
                { name: "date", type: "timestamp", description: "Sale date" }
              ]
            },
            tags: ["sales", "analytics"],
            sla: "99.5%",
            updateFrequency: "Daily",
          }
        ]).returning();

        console.log("Created sample products:", [product1, product2]);
        return res.json([product1, product2]);
      }

      return res.json(products);
    } catch (error) {
      console.error("Error fetching data products:", error);
      return res.status(500).json({ error: "Failed to fetch data products" });
    }
  });

  app.get("/api/metadata/:id", async (req, res) => {
    try {
      console.log("Fetching metadata for product ID:", req.params.id);
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        console.error("Invalid product ID:", req.params.id);
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await db.query.dataProducts.findFirst({
        where: eq(dataProducts.id, productId)
      });

      console.log("Found product:", product);

      if (!product) {
        console.log("No product found for ID:", productId);
        return res.status(404).json({ error: "Data product not found" });
      }

      return res.json(product);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

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

      // Create sample data if none exists
      if (nodes.length === 0) {
        const [source, transform, target] = await db.insert(lineageNodes).values([
          {
            dataProductId: productId,
            type: "source",
            details: { name: "Raw Data Source" }
          },
          {
            dataProductId: productId,
            type: "transformation",
            details: { name: "ETL Process" }
          },
          {
            dataProductId: productId,
            type: "target",
            details: { name: "Analytics Dashboard" }
          }
        ]).returning();

        await db.insert(lineageEdges).values([
          { sourceId: source.id, targetId: transform.id },
          { sourceId: transform.id, targetId: target.id }
        ]);

        return res.json({
          nodes: [source, transform, target].map(node => ({
            id: node.id.toString(),
            type: node.type,
            label: node.details?.name || `Node ${node.id}`,
          })),
          links: [
            { source: source.id.toString(), target: transform.id.toString() },
            { source: transform.id.toString(), target: target.id.toString() }
          ]
        });
      }

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

  app.get("/api/quality-metrics/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      let metrics = await db
        .select()
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, productId));

      if (metrics.length === 0) {
        const [newMetrics] = await db.insert(qualityMetrics).values({
          dataProductId: productId,
          completeness: 95,
          accuracy: 98,
          timeliness: 92,
          customMetrics: {
            data_freshness: 90,
            schema_compliance: 100
          }
        }).returning();

        metrics = [newMetrics];
      }

      const definitions = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.dataProductId, productId));

      return res.json({
        current: {
          completeness: metrics[0].completeness,
          accuracy: metrics[0].accuracy,
          timeliness: metrics[0].timeliness,
          customMetrics: definitions,
        },
        history: [{
          timestamp: metrics[0].timestamp?.toISOString() || new Date().toISOString(),
          completeness: metrics[0].completeness,
          accuracy: metrics[0].accuracy,
          timeliness: metrics[0].timeliness,
        }]
      });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      return res.status(500).json({ error: "Failed to fetch quality metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}