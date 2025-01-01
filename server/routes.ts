import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics, metricDefinitions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Data product routes
  app.get("/api/data-products", async (req, res) => {
    try {
      // First check if we have any data products
      const existingProducts = await db.select().from(dataProducts);

      // If no data products exist, create some sample data
      if (existingProducts.length === 0) {
        await db.insert(dataProducts).values([
          {
            name: "Customer Data Lake",
            description: "Central repository for all customer-related data",
            owner: "Data Engineering Team",
            schema: {
              columns: [
                { name: "customer_id", type: "string", description: "Unique identifier for customer" },
                { name: "name", type: "string", description: "Customer's full name" },
                { name: "email", type: "string", description: "Customer's email address" },
              ]
            },
            tags: ["customer", "core", "production"],
            sla: "99.9%",
            updateFrequency: "Real-time",
          },
          {
            name: "Sales Analytics",
            description: "Sales performance metrics and analysis",
            owner: "Analytics Team",
            schema: {
              columns: [
                { name: "sale_id", type: "string", description: "Unique identifier for sale" },
                { name: "amount", type: "number", description: "Sale amount" },
                { name: "date", type: "timestamp", description: "Sale date" },
              ]
            },
            tags: ["sales", "analytics", "production"],
            sla: "99.5%",
            updateFrequency: "Daily",
          }
        ]);

        // Return the newly created products
        const products = await db.select().from(dataProducts);
        res.json(products);
      } else {
        // Return existing products
        res.json(existingProducts);
      }
    } catch (error) {
      console.error("Error fetching data products:", error);
      res.status(500).json({ error: "Failed to fetch data products" });
    }
  });

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

      res.json(product);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  app.get("/api/lineage/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // Create sample lineage data if it doesn't exist
      const existingNodes = await db
        .select()
        .from(lineageNodes)
        .where(eq(lineageNodes.dataProductId, productId));

      if (existingNodes.length === 0) {
        // Create sample nodes
        const [sourceNode] = await db
          .insert(lineageNodes)
          .values({
            dataProductId: productId,
            type: "source",
            details: { name: "Raw Data Source" }
          })
          .returning();

        const [transformNode] = await db
          .insert(lineageNodes)
          .values({
            dataProductId: productId,
            type: "transformation",
            details: { name: "ETL Process" }
          })
          .returning();

        const [targetNode] = await db
          .insert(lineageNodes)
          .values({
            dataProductId: productId,
            type: "target",
            details: { name: "Analytics Dashboard" }
          })
          .returning();

        // Create edges
        await db.insert(lineageEdges).values([
          { sourceId: sourceNode.id, targetId: transformNode.id },
          { sourceId: transformNode.id, targetId: targetNode.id }
        ]);

        existingNodes.push(sourceNode, transformNode, targetNode);
      }

      const edges = await db
        .select()
        .from(lineageEdges)
        .where(eq(lineageEdges.sourceId, existingNodes[0].id));

      res.json({
        nodes: existingNodes.map(node => ({
          id: node.id.toString(),
          type: node.type,
          label: node.details ? (node.details as any).name || `Node ${node.id}` : `Node ${node.id}`,
        })),
        links: edges.map(edge => ({
          source: edge.sourceId.toString(),
          target: edge.targetId.toString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching lineage:", error);
      res.status(500).json({ error: "Failed to fetch lineage" });
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
        // Create sample metrics
        const [newMetrics] = await db
          .insert(qualityMetrics)
          .values({
            dataProductId: productId,
            completeness: 95,
            accuracy: 98,
            timeliness: 92,
            customMetrics: { 
              "data_freshness": 90,
              "schema_compliance": 100
            }
          })
          .returning();

        metrics = [newMetrics];
      }

      const definitions = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.dataProductId, productId));

      res.json({
        current: {
          completeness: metrics[0]?.completeness ?? 0,
          accuracy: metrics[0]?.accuracy ?? 0,
          timeliness: metrics[0]?.timeliness ?? 0,
          customMetrics: definitions,
        },
        history: [{
          timestamp: metrics[0]?.timestamp ?? new Date().toISOString(),
          completeness: metrics[0]?.completeness ?? 0,
          accuracy: metrics[0]?.accuracy ?? 0,
          timeliness: metrics[0]?.timeliness ?? 0,
        }],
      });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      res.status(500).json({ error: "Failed to fetch quality metrics" });
    }
  });

  app.post("/api/metric-definitions", async (req, res) => {
    try {
      const { dataProductId, name, description, query, threshold } = req.body;

      if (!dataProductId || !name || !query) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newMetric] = await db
        .insert(metricDefinitions)
        .values({
          dataProductId,
          name,
          description,
          query,
          threshold,
          enabled: true,
        })
        .returning();

      res.json(newMetric);
    } catch (error) {
      console.error("Error creating metric definition:", error);
      res.status(500).json({ error: "Failed to create metric definition" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase();
      const products = await db.select().from(dataProducts);

      const results = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );

      res.json(results);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}