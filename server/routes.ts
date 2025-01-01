import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

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

      const metrics = await db
        .select()
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, productId))
        .orderBy(qualityMetrics.timestamp);

      if (metrics.length === 0) {
        return res.json({
          current: {
            completeness: 0,
            accuracy: 0,
            timeliness: 0,
          },
          history: [],
        });
      }

      const current = metrics[metrics.length - 1];
      const history = metrics.map(m => ({
        timestamp: m.timestamp,
        completeness: m.completeness ?? 0,
        accuracy: m.accuracy ?? 0,
        timeliness: m.timeliness ?? 0,
      }));

      res.json({
        current: {
          completeness: current.completeness ?? 0,
          accuracy: current.accuracy ?? 0,
          timeliness: current.timeliness ?? 0,
          customMetrics: current.customMetrics,
        },
        history,
      });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      res.status(500).json({ error: "Failed to fetch quality metrics" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase();
      console.log("Search query:", query);
      const products = await db.select().from(dataProducts);

      const results = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );

      console.log("Search results:", results.length);
      res.json(results);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}