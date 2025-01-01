import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics, metricDefinitions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Data product routes
  app.get("/api/data-products", async (req, res) => {
    try {
      const products = await db.select().from(dataProducts);
      res.json(products);
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

      const nodes = await db
        .select()
        .from(lineageNodes)
        .where(eq(lineageNodes.dataProductId, productId));

      const nodeIds = nodes.map(node => node.id);
      const edges = nodeIds.length > 0
        ? await db
            .select()
            .from(lineageEdges)
            .where(eq(lineageEdges.sourceId, nodeIds[0]))
        : [];

      res.json({
        nodes: nodes.map(node => ({
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

      const [metrics] = await db
        .select()
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, productId))
        .orderBy(qualityMetrics.timestamp)
        .limit(1);

      const definitions = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.dataProductId, productId));

      res.json({
        current: {
          completeness: metrics?.completeness ?? 0,
          accuracy: metrics?.accuracy ?? 0,
          timeliness: metrics?.timeliness ?? 0,
          customMetrics: definitions,
        },
        history: [{
          timestamp: metrics?.timestamp ?? new Date().toISOString(),
          completeness: metrics?.completeness ?? 0,
          accuracy: metrics?.accuracy ?? 0,
          timeliness: metrics?.timeliness ?? 0,
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